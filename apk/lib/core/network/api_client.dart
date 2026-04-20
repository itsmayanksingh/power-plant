import 'package:dio/dio.dart';

import '../constants/api_constants.dart';
import '../logs/app_log_store.dart';
import '../storage/secure_storage_service.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.accessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['Content-Type'] = 'application/json';
          handler.next(options);
        },
        onError: (err, handler) async {
          if (err.response?.statusCode == 401 && !_isRefreshRequest(err.requestOptions.path)) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final retryToken = await SecureStorageService.accessToken();
              final requestOptions = err.requestOptions;
              requestOptions.headers['Authorization'] = 'Bearer $retryToken';
              final response = await _dio.fetch(requestOptions);
              return handler.resolve(response);
            }
          }
          handler.next(err);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();
  late final Dio _dio;

  bool _isRefreshRequest(String path) => path.contains('/auth/refresh');

  Future<bool> _tryRefresh() async {
    try {
      final refreshToken = await SecureStorageService.refreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }
      final response = await _dio.post(
        ApiConstants.refresh,
        data: <String, dynamic>{'refreshToken': refreshToken},
        options: Options(headers: <String, dynamic>{'Authorization': null}),
      );
      final data = response.data['data'] ?? response.data;
      final accessToken = data['accessToken'] as String?;
      final newRefreshToken = (data['refreshToken'] as String?) ?? refreshToken;
      if (accessToken == null) return false;
      await SecureStorageService.saveTokens(
        accessToken: accessToken,
        refreshToken: newRefreshToken,
      );
      return true;
    } catch (_) {
      await SecureStorageService.clearTokens();
      return false;
    }
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return _unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDioError(e, 'GET $path');
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    try {
      final res = await _dio.post(path, data: data);
      return _unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDioError(e, 'POST $path');
    }
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    try {
      final res = await _dio.put(path, data: data);
      return _unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDioError(e, 'PUT $path');
    }
  }

  Map<String, dynamic> _unwrap(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      if (responseData['data'] is Map<String, dynamic>) {
        return responseData['data'] as Map<String, dynamic>;
      }
      return responseData;
    }
    return <String, dynamic>{'value': responseData};
  }

  ApiException _mapDioError(DioException e, String source) {
    final payload = e.response?.data;
    String message = 'Request failed';
    if (payload is Map<String, dynamic> && payload['message'] is String) {
      message = payload['message'] as String;
    } else if (e.message != null) {
      message = e.message!;
    }
    AppLogStore.instance.add(
      level: 'error',
      source: source,
      message: 'status: ${e.response?.statusCode ?? 'unknown'} | $message',
    );
    return ApiException(message: message, statusCode: e.response?.statusCode);
  }
}

