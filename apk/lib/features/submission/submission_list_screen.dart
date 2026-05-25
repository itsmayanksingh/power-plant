import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/storage/local_db.dart';
import '../../core/utils/app_date_formatter.dart';
import '../../core/widgets/app_page.dart';
import '../../shared/models/submission_model.dart';
import '../../shared/repositories/backend_repository.dart';

class SubmissionListScreen extends StatefulWidget {
  const SubmissionListScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<SubmissionListScreen> createState() => _SubmissionListScreenState();
}

class _SubmissionListScreenState extends State<SubmissionListScreen>
    with SingleTickerProviderStateMixin {
  bool _loading = true;
  List<SubmissionModel> _rows = [];

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 360));
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
      final rows = await BackendRepository.instance.mySubmissions();
      if (mounted) setState(() => _rows = rows);
      _fadeCtrl.forward();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /// Short display ID: first 8 chars of the UUID, uppercased.
  String _shortId(String id) {
    final s = id.length > 8 ? id.substring(0, 8) : id;
    return s.toUpperCase();
  }

  /// 1–2 letter avatar derived from site name.
  String _initials(SubmissionModel s) {
    final name = s.siteName!.isNotEmpty ? s.siteName : s.id;
    final words = name!.trim().split(RegExp(r'\s+'));
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length > 2 ? 2 : name.length).toUpperCase();
  }

  // ── Status styling ────────────────────────────────────────────────────────
  ({Color bg, Color fg, IconData icon}) _statusStyle(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
        bg: const Color(0xFFE1F5EE),
        fg: const Color(0xFF0F6E56),
        icon: Icons.check_circle_outline_rounded,
        );
      case 'rejected':
        return (
        bg: const Color(0xFFFCEBEB),
        fg: const Color(0xFFA32D2D),
        icon: Icons.cancel_outlined,
        );
      case 'syncing':
        return (
        bg: const Color(0xFFE6F1FB),
        fg: const Color(0xFF185FA5),
        icon: Icons.sync_rounded,
        );
      case 'pending':
      default:
        return (
        bg: const Color(0xFFFAEEDA),
        fg: const Color(0xFF854F0B),
        icon: Icons.schedule_rounded,
        );
    }
  }

  // ── Widgets ──────────────────────────────────────────────────────────────

  Widget _buildSyncBanner() {
    final cs = Theme.of(context).colorScheme;
    final pendingCount = LocalDb.pendingBox().length;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: pendingCount > 0
              ? const Color(0xFFEF9F27).withOpacity(0.5)
              : cs.outlineVariant.withOpacity(0.4),
          width: pendingCount > 0 ? 1 : 0.8,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: pendingCount > 0
                  ? const Color(0xFFFAEEDA)
                  : const Color(0xFFE1F5EE),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              pendingCount > 0
                  ? Icons.cloud_upload_outlined
                  : Icons.cloud_done_outlined,
              size: 22,
              color: pendingCount > 0
                  ? const Color(0xFF854F0B)
                  : const Color(0xFF0F6E56),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pendingCount > 0
                      ? '$pendingCount pending offline record${pendingCount == 1 ? '' : 's'}'
                      : 'All records synced',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  pendingCount > 0
                      ? 'Will sync automatically on internet restore'
                      : 'No pending uploads',
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurface.withOpacity(0.45),
                  ),
                ),
              ],
            ),
          ),
          if (pendingCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFFAEEDA),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$pendingCount',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF854F0B),
                ),
              ),
            ),
        ],
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
        letterSpacing: 0.7,
        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.45),
      ),
    ),
  );

  Widget _buildSubmissionRow(SubmissionModel s) {
    final cs = Theme.of(context).colorScheme;
    final ss = _statusStyle(s.status);
    final initials = _initials(s);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: cs.outlineVariant.withOpacity(0.4), width: 0.8),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.push('/submissions/${s.id}'),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                // ── Initials avatar ──────────────────────────────────
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: cs.surfaceVariant.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initials,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface.withOpacity(0.55),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // ── ID + site + date ─────────────────────────────────
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _shortId(s.id),
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      if (s.siteName!.isNotEmpty)
                        Row(
                          children: [
                            Icon(Icons.factory_outlined,
                                size: 11,
                                color: cs.onSurface.withOpacity(0.35)),
                            const SizedBox(width: 3),
                          ],
                        ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.calendar_today_outlined,
                              size: 11,
                              color: cs.onSurface.withOpacity(0.35)),
                          const SizedBox(width: 3),
                          Text(
                            AppDateFormatter.dateTime(s.createdAt),
                            style: TextStyle(
                              fontSize: 11,
                              color: cs.onSurface.withOpacity(0.4),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 10),

                // ── Status pill ──────────────────────────────────────
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: ss.bg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(ss.icon, size: 10, color: ss.fg),
                          const SizedBox(width: 3),
                          Text(
                            s.status,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: ss.fg,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(width: 6),
                Icon(Icons.chevron_right_rounded,
                    size: 18,
                    color: cs.onSurface.withOpacity(0.25)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_outlined,
              size: 36, color: cs.onSurface.withOpacity(0.2)),
          const SizedBox(height: 10),
          Text(
            'No submissions found',
            style: TextStyle(
                fontSize: 14, color: cs.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }

  // ── Body ─────────────────────────────────────────────────────────────────

  Widget _body() {
    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          if (_loading)
            const SliverToBoxAdapter(
              child: LinearProgressIndicator(minHeight: 2),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Sync banner ──────────────────────────────────────
                _buildSyncBanner(),
                const SizedBox(height: 20),

                // ── List ─────────────────────────────────────────────
                _buildSectionLabel('Recent Submissions'),

                if (!_loading && _rows.isEmpty)
                  _buildEmpty()
                else
                  FadeTransition(
                    opacity: _fadeAnim,
                    child: Column(
                      children: _rows.map(_buildSubmissionRow).toList(),
                    ),
                  ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) return _body();

    return AppPage(
      title: 'My Submissions',
      child: _body(),
    );
  }
}