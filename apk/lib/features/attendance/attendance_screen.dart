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

class _AttendanceScreenState extends State<AttendanceScreen>
    with SingleTickerProviderStateMixin {
  bool _loading = true;
  bool _submitting = false;
  List<AttendanceModel> _records = [];
  String? _siteId;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  // ── Derived summary stats ────────────────────────────────────────────────
  int get _presentCount =>
      _records.where((r) => r.status.toLowerCase() == 'present').length;

  int get _lateCount =>
      _records.where((r) => r.status.toLowerCase() == 'late').length;

  // Average hours worked (records that have both check-in & check-out)
  String get _avgHours {
    final completed =
    _records.where((r) => r.checkIn != null && r.checkOut != null).toList();
    if (completed.isEmpty) return '—';
    final total = completed.fold<Duration>(
      Duration.zero,
          (acc, r) => acc + r.checkOut!.difference(r.checkIn!),
    );
    final avg = total ~/ completed.length;
    final h = avg.inHours;
    final m = avg.inMinutes.remainder(60);
    return '${h}h ${m.toString().padLeft(2, '0')}m';
  }

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _load();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    _fadeCtrl.reset();
    try {
      _siteId = await BackendRepository.instance.resolveCurrentSiteId();
      final records = await BackendRepository.instance.myAttendance();
      if (mounted) setState(() => _records = records);
      _fadeCtrl.forward();
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

  // ── Formatters ───────────────────────────────────────────────────────────
  String _fmtTime(DateTime? dt) {
    if (dt == null) return '—';
    final t = dt.toLocal();
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _fmtDate(DateTime? dt) {
    if (dt == null) return '—';
    final t = dt.toLocal();
    final months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    return '${t.day} ${months[t.month - 1]} ${t.year}';
  }

  String _duration(DateTime? ci, DateTime? co) {
    if (ci == null || co == null) return '';
    final diff = co.difference(ci);
    final h = diff.inHours;
    final m = diff.inMinutes.remainder(60);
    return '${h}h ${m.toString().padLeft(2, '0')}m';
  }

  // ── Colors ───────────────────────────────────────────────────────────────
  Color _statusBg(String s) {
    switch (s.toLowerCase()) {
      case 'present':
        return const Color(0xFFE1F5EE);
      case 'late':
        return const Color(0xFFFAEEDA);
      case 'absent':
        return const Color(0xFFFCEBEB);
      default:
        return const Color(0xFFE6F1FB);
    }
  }

  Color _statusFg(String s) {
    switch (s.toLowerCase()) {
      case 'present':
        return const Color(0xFF0F6E56);
      case 'late':
        return const Color(0xFF854F0B);
      case 'absent':
        return const Color(0xFFA32D2D);
      default:
        return const Color(0xFF185FA5);
    }
  }

  IconData _statusIcon(String s) {
    switch (s.toLowerCase()) {
      case 'present':
        return Icons.check_circle_outline_rounded;
      case 'late':
        return Icons.schedule_rounded;
      case 'absent':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline_rounded;
    }
  }

  // ── Widgets ──────────────────────────────────────────────────────────────

  Widget _buildMetricCard({
    required IconData icon,
    required String label,
    required String value,
    required String sub,
    required Color iconColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: iconColor),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                height: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                letterSpacing: 0.3,
              ),
            ),
            Text(
              sub,
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: _ActionButton(
            label: 'Check In',
            icon: Icons.login_rounded,
            loading: _submitting,
            filled: true,
            onTap: _submitting ? null : () => _mark(true),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _ActionButton(
            label: 'Check Out',
            icon: Icons.logout_rounded,
            loading: false,
            filled: false,
            onTap: _submitting ? null : () => _mark(false),
          ),
        ),
      ],
    );
  }

  Widget _buildRecordCard(AttendanceModel record) {
    final statusColor = _statusFg(record.status);
    final statusBg = _statusBg(record.status);
    final dur = _duration(record.checkIn, record.checkOut);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Theme.of(context).dividerColor.withOpacity(0.25),
          width: 0.8,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top row: site name + badge ─────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        record.siteName.isEmpty ? 'Unknown Site' : record.siteName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        record.attendanceDate,
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withOpacity(0.45),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_statusIcon(record.status),
                          size: 12, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        record.status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ── Time blocks ────────────────────────────────────────────
            Row(
              children: [
                _TimeBlock(
                  label: 'Check-in',
                  value: _fmtTime(record.checkIn),
                  icon: Icons.login_rounded,
                ),
                const SizedBox(width: 8),
                _TimeBlock(
                  label: 'Check-out',
                  value: _fmtTime(record.checkOut),
                  icon: Icons.logout_rounded,
                ),
                if (dur.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _TimeBlock(
                    label: 'Duration',
                    value: dur,
                    icon: Icons.timer_outlined,
                  ),
                ],
              ],
            ),

            const SizedBox(height: 10),

            // ── Location ───────────────────────────────────────────────
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 13,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.35),
                ),
                const SizedBox(width: 3),
                Text(
                  '${record.checkInLat?.toStringAsFixed(4) ?? '—'}, '
                      '${record.checkInLng?.toStringAsFixed(4) ?? '—'}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withOpacity(0.4),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(
      text.toUpperCase(),
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.45),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: cs.background,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Attendance',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
            ),
            Text(
              _fmtDate(DateTime.now()),
              style: TextStyle(
                fontSize: 12,
                color: cs.onSurface.withOpacity(0.45),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Loading bar
            if (_loading)
              const SliverToBoxAdapter(
                child: LinearProgressIndicator(minHeight: 2),
              ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── Summary metrics ──────────────────────────────────
                  if (!_loading) ...[
                    Row(
                      children: [
                        _buildMetricCard(
                          icon: Icons.event_available_rounded,
                          label: 'Present',
                          value: '$_presentCount',
                          sub: 'this month',
                          iconColor: const Color(0xFF1D9E75),
                        ),
                        const SizedBox(width: 8),
                        _buildMetricCard(
                          icon: Icons.access_time_rounded,
                          label: 'Avg hours',
                          value: _avgHours,
                          sub: 'per day',
                          iconColor: const Color(0xFF185FA5),
                        ),
                        const SizedBox(width: 8),
                        _buildMetricCard(
                          icon: Icons.warning_amber_rounded,
                          label: 'Late',
                          value: '$_lateCount',
                          sub: 'this month',
                          iconColor: const Color(0xFFBA7517),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Action buttons ───────────────────────────────────
                  _buildActionButtons(),
                  const SizedBox(height: 24),

                  // ── Records ──────────────────────────────────────────
                  if (!_loading) ...[
                    _buildSectionLabel('Recent Records'),
                    if (_records.isEmpty)
                      _EmptyState()
                    else
                      FadeTransition(
                        opacity: _fadeAnim,
                        child: Column(
                          children: _records
                              .map(_buildRecordCard)
                              .toList(),
                        ),
                      ),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _TimeBlock extends StatelessWidget {
  const _TimeBlock({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: cs.surfaceVariant.withOpacity(0.45),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon,
                    size: 11,
                    color: cs.onSurface.withOpacity(0.4)),
                const SizedBox(width: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    color: cs.onSurface.withOpacity(0.45),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.loading,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool loading;
  final bool filled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bg = filled ? const Color(0xFF1D9E75) : Colors.transparent;
    final fg = filled ? Colors.white : cs.onSurface;
    final border = filled
        ? BorderSide.none
        : BorderSide(color: cs.outline.withOpacity(0.4), width: 0.8);

    return AnimatedOpacity(
      opacity: onTap == null ? 0.55 : 1.0,
      duration: const Duration(milliseconds: 200),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.fromBorderSide(border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading && filled)
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: fg,
                    ),
                  )
                else
                  Icon(icon, size: 18, color: fg),
                const SizedBox(width: 8),
                Text(
                  loading && filled ? 'Submitting...' : label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: fg,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(Icons.event_busy_rounded,
              size: 36, color: cs.onSurface.withOpacity(0.25)),
          const SizedBox(height: 10),
          Text(
            'No attendance records',
            style: TextStyle(
              fontSize: 14,
              color: cs.onSurface.withOpacity(0.45),
            ),
          ),
        ],
      ),
    );
  }
}