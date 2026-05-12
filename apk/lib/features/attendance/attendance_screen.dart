import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/services/toast_service.dart';
import '../../core/widgets/status_chip.dart';
import '../../shared/models/attendance_model.dart';
import '../../shared/repositories/backend_repository.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _loading = true;
  bool _submitting = false;
  List<AttendanceModel> _records = <AttendanceModel>[];
  String? _siteId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    try {
      _siteId = await BackendRepository.instance.resolveCurrentSiteId();
      final records = await BackendRepository.instance.myAttendance();
      if (mounted) setState(() => _records = records);
    } catch (e) {
      debugPrint('AttendanceScreen._load error: $e');
      if (mounted) ToastService.error('Failed to load attendance');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _mark(bool checkIn) async {
    if (mounted) setState(() => _submitting = true);
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        ToastService.error('Location permission denied');
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      final siteId =
          _siteId ?? await BackendRepository.instance.resolveCurrentSiteId();

      if (checkIn) {
        await BackendRepository.instance.checkIn(
          siteId: siteId,
          lat: pos.latitude,
          lng: pos.longitude,
        );
        ToastService.success('Check-in marked');
      } else {
        await BackendRepository.instance.checkOut(
          siteId: siteId,
          lat: pos.latitude,
          lng: pos.longitude,
        );
        ToastService.success('Check-out marked');
      }

      await _load();
    } catch (e) {
      debugPrint('AttendanceScreen._mark error: $e');
      ToastService.error('Attendance failed: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _fmt(DateTime? dt) {
    if (dt == null) return '-';
    final t = dt.toLocal();
    final d = t.day.toString().padLeft(2, '0');
    final mo = t.month.toString().padLeft(2, '0');
    final h = t.hour.toString().padLeft(2, '0');
    final mi = t.minute.toString().padLeft(2, '0');
    return '$d/$mo/${t.year}  $h:$mi';
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          // ── Check In / Check Out buttons ──
          Row(
            children: <Widget>[
              Expanded(
                child: FilledButton.icon(
                  onPressed: _submitting ? null : () => _mark(true),
                  icon: const Icon(Icons.login),
                  label: Text(_submitting ? 'Submitting...' : 'Check In'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _submitting ? null : () => _mark(false),
                  icon: const Icon(Icons.logout),
                  label: const Text('Check Out'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // ── Loading indicator ──
          if (_loading) const LinearProgressIndicator(),

          if (!_loading) ...[
            const Text(
              'Today and previous marks',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 8),

            // ── Empty state ──
            if (_records.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No attendance records found.'),
                ),
              ),

            // ── Records list ──
            ..._records.map(
                  (record) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  title: Text(
                    '${record.siteName.isEmpty ? 'Site' : record.siteName}'
                        '  •  ${record.attendanceDate}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Check-in:   ${_fmt(record.checkIn)}'
                          '\nCheck-out: ${_fmt(record.checkOut)}'
                          '\nLat / Lng:  '
                          '${record.checkInLat?.toStringAsFixed(4) ?? '-'} / '
                          '${record.checkInLng?.toStringAsFixed(4) ?? '-'}',
                      style: const TextStyle(height: 1.6),
                    ),
                  ),
                  isThreeLine: true,
                  trailing: StatusChip(status: record.status),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}