import 'package:connectivity_plus/connectivity_plus.dart';

import '../../core/constants/api_constants.dart';
import '../../core/logs/app_log_store.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/storage/local_db.dart';
import '../../core/storage/secure_storage_service.dart';
import '../models/attendance_model.dart';
import '../models/site_model.dart';
import '../models/submission_model.dart';
import '../models/user_model.dart';

class BackendRepository {
  BackendRepository._();
  static final BackendRepository instance = BackendRepository._();

  final ApiClient _client = ApiClient.instance;

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final data = await _client.post(
      ApiConstants.login,
      data: <String, dynamic>{'email': email, 'password': password},
    );
    final user = _userFromAny(data);
    final accessToken = _readString(data, <String>['accessToken', 'token']);
    final refreshToken = _readString(data, <String>['refreshToken']) ?? '';
    if (accessToken == null) {
      throw ApiException(message: 'Invalid login response');
    }
    await SecureStorageService.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    return user;
  }

  Future<void> logout() async {
    try {
      final refreshToken = await SecureStorageService.refreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _client.post(
          ApiConstants.logout,
          data: <String, dynamic>{'refreshToken': refreshToken},
        );
      }
    } catch (_) {}
    await SecureStorageService.clearTokens();
  }

  Future<UserModel> getMe() async {
    final data = await _client.get(ApiConstants.me);
    return _userFromAny(data);
  }

  Future<UserModel> updateMe(Map<String, dynamic> payload) async {
    final data = await _client.put(ApiConstants.me, data: payload);
    return _userFromAny(data);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _client.post(
      ApiConstants.changePassword,
      data: <String, dynamic>{
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }

  Future<List<AttendanceModel>> myAttendance() async {
    final data = await _client.get(ApiConstants.attendanceMy);
    print('=== ATTENDANCE RAW RESPONSE ===');
    print(data);
    final list = _extractList(data);
    print('=== EXTRACTED LIST LENGTH: ${list.length} ===');
    if (list.isNotEmpty) print('=== FIRST RECORD: ${list.first} ===');
    return list.map(AttendanceModel.fromJson).toList();
  }

  Future<void> checkIn({
    required String siteId,
    required double lat,
    required double lng,
  }) async {
    await _client.post(
      ApiConstants.attendanceCheckIn,
      data: <String, dynamic>{
        'siteId': siteId,
        'latitude': lat,
        'longitude': lng,
      },
    );
  }

  Future<void> checkOut({
    required String siteId,
    required double lat,
    required double lng,
  }) async {
    await _client.post(
      ApiConstants.attendanceCheckOut,
      data: <String, dynamic>{
        'siteId': siteId,
        'latitude': lat,
        'longitude': lng,
      },
    );
  }

  Future<SiteModel> mySite() async {
    final data = await _client.get(ApiConstants.mySite);
    final siteMap = (data['site'] is Map<String, dynamic>) ? Map<String, dynamic>.from(data['site']) : data;
    if (data['parameters'] is List) {
      siteMap['parameters'] = data['parameters'];
    }
    await LocalDb.settings().put('current_site', <String, dynamic>{'siteId': siteMap['id']?.toString() ?? ''});
    return SiteModel.fromJson(siteMap);
  }

  Future<List<SubmissionModel>> mySubmissions() async {
    final data = await _client.get(ApiConstants.submissions);
    final list = _extractList(data);
    return list.map(SubmissionModel.fromJson).toList();
  }

  Future<SubmissionModel> submissionById(String id) async {
    final data = await _client.get('${ApiConstants.submissions}/$id');
    return SubmissionModel.fromJson(
      (data['submission'] is Map<String, dynamic>)
          ? data['submission'] as Map<String, dynamic>
          : data,
    );
  }

  Future<void> createSubmission(Map<String, dynamic> payload) async {
    final isOnline = await _isOnline();
    if (!isOnline) {
      await _savePendingSubmission(payload);
      return;
    }
    try {
      await _client.post(ApiConstants.submissions, data: payload);
    } catch (e) {
      await _savePendingSubmission(payload);
      rethrow;
    }
  }

  Future<void> syncPendingSubmissions() async {
    final box = LocalDb.pendingBox();
    final keys = box.keys.toList(growable: false);
    for (final key in keys) {
      final row = box.get(key);
      if (row == null) continue;
      try {
        await _client.post(ApiConstants.submissions, data: Map<String, dynamic>.from(row));
        await box.delete(key);
        LocalDb.syncLogs().add(
          <String, dynamic>{
            'status': 'success',
            'message': 'Synced pending submission',
            'at': DateTime.now().toIso8601String(),
          },
        );
      } catch (e) {
        LocalDb.syncLogs().add(
          <String, dynamic>{
            'status': 'failed',
            'message': e.toString(),
            'at': DateTime.now().toIso8601String(),
          },
        );
        AppLogStore.instance.add(
          level: 'error',
          message: 'Pending sync failed: $e',
          source: 'syncPendingSubmissions',
        );
      }
    }
  }

  Future<String> resolveCurrentSiteId() async {
    final setting = LocalDb.settings().get('current_site');
    if (setting != null && (setting['siteId']?.toString().isNotEmpty ?? false)) {
      return setting['siteId'].toString();
    }
    final site = await mySite();
    return site.id;
  }

  Map<String, dynamic> buildSubmissionPayload({
    required String siteId,
    required Map<String, dynamic> valuesByParameterId,
    String? notes,
    DateTime? submissionDate,
  }) {
    final valueRows = <Map<String, dynamic>>[];
    valuesByParameterId.forEach((key, value) {
      valueRows.add(
        <String, dynamic>{
          'parameterId': key,
          'value': value,
        },
      );
    });
    return <String, dynamic>{
      'siteId': siteId,
      'submissionDate': (submissionDate ?? DateTime.now()).toIso8601String().substring(0, 10),
      'notes': notes?.trim().isEmpty ?? true ? null : notes!.trim(),
      'values': valueRows,
    };
  }

  Future<bool> _isOnline() async {
    final status = await Connectivity().checkConnectivity();
    return status.any((result) => result != ConnectivityResult.none);
  }

  Future<void> _savePendingSubmission(Map<String, dynamic> payload) async {
    await LocalDb.pendingBox().add(payload);
    AppLogStore.instance.add(
      level: 'info',
      source: 'offline',
      message: 'Submission saved locally for later sync.',
    );
  }

  List<Map<String, dynamic>> _extractList(Map<String, dynamic> data) {
    final listRaw = (data['items'] as List?) ??
        (data['rows'] as List?) ??
        (data['submissions'] as List?) ??
        (data['attendance'] as List?) ??
        (data['records'] as List?) ??   // <-- add
        (data['results'] as List?) ??   // <-- add
        (data['data'] as List?) ??
        <dynamic>[];
    return listRaw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  UserModel _userFromAny(Map<String, dynamic> data) {
    if (data['user'] is Map<String, dynamic>) {
      return UserModel.fromJson(data['user'] as Map<String, dynamic>);
    }
    return UserModel.fromJson(data);
  }

  String? _readString(Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final value = data[key];
      if (value is String && value.isNotEmpty) return value;
    }
    return null;
  }
}
