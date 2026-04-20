import 'package:flutter/material.dart';

import '../../core/services/toast_service.dart';
import '../../core/storage/local_db.dart';
import '../../core/widgets/app_page.dart';
import '../../shared/repositories/backend_repository.dart';

class SyncScreen extends StatefulWidget {
  const SyncScreen({super.key});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  bool _syncing = false;

  Future<void> _syncNow() async {
    setState(() => _syncing = true);
    try {
      await BackendRepository.instance.syncPendingSubmissions();
      ToastService.success('Sync completed');
    } catch (e) {
      ToastService.error('Sync failed: $e');
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = LocalDb.pendingBox();
    final logs = LocalDb.syncLogs();
    return AppPage(
      title: 'Offline Sync',
      child: ListView(
        children: <Widget>[
          Card(
            child: ListTile(
              title: const Text('Pending Records'),
              trailing: Text('${pending.length}'),
              subtitle: const Text('Queued while offline'),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _syncing ? null : _syncNow,
            icon: _syncing
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.sync),
            label: Text(_syncing ? 'Syncing...' : 'Sync Now'),
          ),
          const SizedBox(height: 16),
          const Text('Sync Logs', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (logs.isEmpty) const Text('No sync attempts yet.'),
          ...logs.values.map(
            (value) {
              final row = Map<String, dynamic>.from(value);
              return Card(
                child: ListTile(
                  title: Text(row['message']?.toString() ?? 'No message'),
                  subtitle: Text(row['at']?.toString() ?? ''),
                  trailing: Text((row['status']?.toString() ?? '').toUpperCase()),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
