import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/services/toast_service.dart';
import '../../core/utils/app_date_formatter.dart';
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
    setState(() => _loading = true);
    try {
      _siteId = await BackendRepository.instance.resolveCurrentSiteId();
      _records = await BackendRepository.instance.myAttendance();
    } catch (_) {}
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Future<void> _mark(bool checkIn) async {
    setState(() => _submitting = true);
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        ToastService.error('Location permission denied');
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      final siteId = _siteId ?? await BackendRepository.instance.resolveCurrentSiteId();
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
      ToastService.error('Attendance failed: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
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
          const SizedBox(height: 14),
          if (_loading) const LinearProgressIndicator(),
          const Text('Today and previous marks', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (!_loading && _records.isEmpty)
            const Card(child: Padding(padding: EdgeInsets.all(12), child: Text('No attendance records found.'))),
          ..._records.map(
            (record) => Card(
              child: ListTile(
                title: Text('${record.siteName.isEmpty ? 'Site' : record.siteName} • ${record.attendanceDate}'),
                subtitle: Text(
                  'In: ${record.checkIn != null ? AppDateFormatter.dateTime(record.checkIn!) : '-'}'
                  '\nOut: ${record.checkOut != null ? AppDateFormatter.dateTime(record.checkOut!) : '-'}'
                  '\nLat/Lng: ${record.checkInLat?.toStringAsFixed(4) ?? '-'} / ${record.checkInLng?.toStringAsFixed(4) ?? '-'}',
                ),
                isThreeLine: true,
                trailing: StatusChip(status: record.status),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
