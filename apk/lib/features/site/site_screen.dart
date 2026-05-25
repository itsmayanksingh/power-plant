import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/models/site_model.dart';
import '../../shared/repositories/backend_repository.dart';

class SiteScreen extends StatefulWidget {
  const SiteScreen({super.key});

  @override
  State<SiteScreen> createState() => _SiteScreenState();
}

class _SiteScreenState extends State<SiteScreen>
    with SingleTickerProviderStateMixin {
  SiteModel? _site;
  bool _loading = true;
  String? _error;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
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
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    _fadeCtrl.reset();
    try {
      final site = await BackendRepository.instance.mySite();
      if (mounted) setState(() => _site = site);
      _fadeCtrl.forward();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Derived counts ───────────────────────────────────────────────────────
  int get _requiredCount =>
      _site?.parameters.where((p) => p.required).length ?? 0;

  // ── Parameter icon & color ───────────────────────────────────────────────
  ({IconData icon, Color bg, Color fg}) _paramStyle(SiteParameter p) {
    final name = p.name.toLowerCase();
    if (name.contains('temp')) {
      return (
      icon: Icons.thermostat_rounded,
      bg: const Color(0xFFE1F5EE),
      fg: const Color(0xFF0F6E56),
      );
    }
    if (name.contains('ph') ||
        name.contains('water') ||
        name.contains('level')) {
      return (
      icon: Icons.water_drop_outlined,
      bg: const Color(0xFFE6F1FB),
      fg: const Color(0xFF185FA5),
      );
    }
    if (name.contains('air') ||
        name.contains('wind') ||
        name.contains('aqi')) {
      return (
      icon: Icons.air_rounded,
      bg: const Color(0xFFFAEEDA),
      fg: const Color(0xFF854F0B),
      );
    }
    if (name.contains('image') ||
        name.contains('photo') ||
        name.contains('camera')) {
      return (
      icon: Icons.photo_camera_outlined,
      bg: const Color(0xFFF1EFE8),
      fg: const Color(0xFF5F5E5A),
      );
    }
    if (p.type.toLowerCase() == 'text' ||
        name.contains('remark') ||
        name.contains('note')) {
      return (
      icon: Icons.notes_rounded,
      bg: const Color(0xFFF1EFE8),
      fg: const Color(0xFF5F5E5A),
      );
    }
    return (
    icon: Icons.data_usage_rounded,
    bg: const Color(0xFFEEEDFE),
    fg: const Color(0xFF534AB7),
    );
  }

  // ── Widgets ──────────────────────────────────────────────────────────────

  Widget _buildSiteHeader(SiteModel site) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.4),
          width: 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Site identity row ────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F1FB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.factory_outlined,
                  color: Color(0xFF185FA5),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            site.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // SiteModel has no active flag — show a
                        // static "Assigned" badge instead
                        _StatusBadge(active: true),
                      ],
                    ),
                    const SizedBox(height: 4),
                    _MetaRow(
                      icon: Icons.location_on_outlined,
                      text: site.location,
                    ),
                    _MetaRow(
                      icon: Icons.tag_rounded,
                      text: 'ID: ${site.id}',
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),
          Divider(
            color: cs.outlineVariant.withValues(alpha: 0.3),
            height: 1,
            thickness: 0.8,
          ),
          const SizedBox(height: 14),

          // ── Summary tiles ────────────────────────────────────────────
          Row(
            children: [
              _SummaryTile(
                label: 'Parameters',
                value: '${site.parameters.length}',
              ),
              const SizedBox(width: 8),
              _SummaryTile(
                label: 'Required',
                value: '$_requiredCount',
              ),
              const SizedBox(width: 8),
              _SummaryTile(
                label: 'Optional',
                value: '${site.parameters.length - _requiredCount}',
              ),
            ],
          ),

          const SizedBox(height: 14),

          // ── CTA button ───────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: _SubmitButton(
              onTap: () => context.push('/submit', extra: site),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParameterCard(SiteParameter p) {
    final cs = Theme.of(context).colorScheme;
    final style = _paramStyle(p);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.4),
          width: 0.8,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: style.bg,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(style.icon, size: 18, color: style.fg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Type: ${p.type}',
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurface.withValues(alpha: 0.45),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _RequiredPill(required: p.required),
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
        color: Theme.of(context)
            .colorScheme
            .onSurface
            .withValues(alpha: 0.45),
      ),
    ),
  );

  // ── States ───────────────────────────────────────────────────────────────

  Widget _buildLoading() => const SliverFillRemaining(
    child: Center(
      child: CircularProgressIndicator(strokeWidth: 2),
    ),
  );

  Widget _buildError() => SliverFillRemaining(
    child: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_rounded,
              size: 40,
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withValues(alpha: 0.25),
            ),
            const SizedBox(height: 12),
            Text(
              'Failed to load site',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _error ?? '',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.35),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _buildEmpty() => SliverFillRemaining(
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.domain_disabled_rounded,
            size: 40,
            color: Theme.of(context)
                .colorScheme
                .onSurface
                .withValues(alpha: 0.2),
          ),
          const SizedBox(height: 12),
          Text(
            'No site assigned yet',
            style: TextStyle(
              fontSize: 15,
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withValues(alpha: 0.45),
            ),
          ),
        ],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final site = _site;

    return Scaffold(
      // FIX: cs.background → cs.surface (deprecated after v3.18)
      backgroundColor: cs.surface,
      appBar: AppBar(
        elevation: 0,
        // FIX: cs.background → cs.surface
        backgroundColor: cs.surface,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'My Site',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
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
            if (_loading) _buildLoading(),
            if (!_loading && _error != null) _buildError(),
            if (!_loading && _error == null && site == null) _buildEmpty(),
            if (!_loading && _error == null && site != null)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    FadeTransition(
                      opacity: _fadeAnim,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSiteHeader(site),
                          const SizedBox(height: 20),
                          _buildSectionLabel('Active Parameters'),
                          ...site.parameters.map(_buildParameterCard),
                        ],
                      ),
                    ),
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

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 13, color: cs.onSurface.withValues(alpha: 0.4)),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: cs.onSurface.withValues(alpha: 0.5),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: active
            ? const Color(0xFFE1F5EE)
        // FIX: surfaceVariant → surfaceContainerHighest
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            active ? Icons.circle : Icons.circle_outlined,
            size: 7,
            color: active ? const Color(0xFF0F6E56) : Colors.grey,
          ),
          const SizedBox(width: 4),
          Text(
            active ? 'Active' : 'Inactive',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: active
                  ? const Color(0xFF0F6E56)
                  : cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.label,
    required this.value,
    this.valueSize = 20,
  });
  final String label;
  final String value;
  final double valueSize;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          // FIX: surfaceVariant → surfaceContainerHighest
          color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: cs.onSurface.withValues(alpha: 0.45),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: valueSize,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _SubmitButton extends StatelessWidget {
  const _SubmitButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF1D9E75),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: const Padding(
          padding: EdgeInsets.symmetric(vertical: 13),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // FIX: Icons.assignment_add_rounded doesn't exist →
              // use Icons.add_task_rounded
              Icon(Icons.add_task_rounded, size: 18, color: Colors.white),
              SizedBox(width: 8),
              Text(
                "Submit today's data",
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RequiredPill extends StatelessWidget {
  const _RequiredPill({required this.required});
  final bool required;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: required
            ? const Color(0xFFFCEBEB)
        // FIX: surfaceVariant → surfaceContainerHighest
            : cs.surfaceContainerHighest.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        required ? 'Required' : 'Optional',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: required
              ? const Color(0xFFA32D2D)
              : cs.onSurface.withValues(alpha: 0.45),
        ),
      ),
    );
  }
}