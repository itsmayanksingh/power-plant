import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/storage/local_db.dart';
import '../../core/utils/app_date_formatter.dart';
import '../../core/widgets/app_page.dart';
import '../../core/widgets/status_chip.dart';
import '../../shared/models/submission_model.dart';
import '../../shared/repositories/backend_repository.dart';

class SubmissionListScreen extends StatefulWidget {
  const SubmissionListScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<SubmissionListScreen> createState() => _SubmissionListScreenState();
}

class _SubmissionListScreenState extends State<SubmissionListScreen> {
  bool _loading = true;
  List<SubmissionModel> _rows = <SubmissionModel>[];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _rows = await BackendRepository.instance.mySubmissions();
    } catch (_) {}
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Widget _body() {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        children: <Widget>[
          Card(
            child: ListTile(
              leading: const Icon(Icons.cloud_upload_outlined),
              title: const Text('Pending Offline Records'),
              trailing: Text('${LocalDb.pendingBox().length}'),
              subtitle: const Text('Records that will auto-sync on internet restore'),
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          if (!_loading && _rows.isEmpty)
            const Card(child: Padding(padding: EdgeInsets.all(12), child: Text('No submissions found.'))),
          ..._rows.map(
            (s) => Card(
              child: ListTile(
                title: Text('Submission ${s.id.substring(0, s.id.length > 8 ? 8 : s.id.length)}'),
                subtitle: Text(AppDateFormatter.dateTime(s.createdAt)),
                trailing: StatusChip(status: s.status),
                onTap: () => context.push('/submissions/${s.id}'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return _body();
    }
    return AppPage(title: 'My Submissions', child: _body());
  }
}

