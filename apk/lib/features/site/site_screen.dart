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

class _SiteScreenState extends State<SiteScreen> {
  SiteModel? _site;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _site = await BackendRepository.instance.mySite();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Text('Failed to load site: $_error'),
        ),
      );
    }
    final site = _site;
    if (site == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Text('No site assigned yet.'),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(site.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                  const SizedBox(height: 6),
                  Text(site.location, style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => context.push('/submit', extra: site),
                    icon: const Icon(Icons.assignment_add),
                    label: const Text('Submit Today Data'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Text('Active Parameters', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          ...site.parameters.map(
            (p) => Card(
              child: ListTile(
                title: Text(p.name),
                subtitle: Text('Type: ${p.type}'),
                trailing: p.required
                    ? const Text('Required', style: TextStyle(color: AppColors.warning))
                    : const Text('Optional', style: TextStyle(color: AppColors.textSecondary)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

