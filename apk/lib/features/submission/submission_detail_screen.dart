import 'package:flutter/material.dart';

import '../../core/widgets/app_page.dart';
import '../../core/widgets/status_chip.dart';
import '../../shared/models/submission_model.dart';
import '../../shared/repositories/backend_repository.dart';

class SubmissionDetailScreen extends StatefulWidget {
  const SubmissionDetailScreen({required this.id, super.key});
  final String id;

  @override
  State<SubmissionDetailScreen> createState() => _SubmissionDetailScreenState();
}

class _SubmissionDetailScreenState extends State<SubmissionDetailScreen> {
  bool _loading = true;
  SubmissionModel? _item;
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
      _item = await BackendRepository.instance.submissionById(widget.id);
    } catch (e) {
      _error = '$e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'Submission Detail',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Text('Error: $_error')
              : ListView(
                  children: <Widget>[
                    Card(
                      child: ListTile(
                        title: Text('ID: ${_item!.id}'),
                        trailing: StatusChip(status: _item!.status),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text('Values', style: TextStyle(fontWeight: FontWeight.w700)),
                    ..._item!.values.map(
                      (e) => Card(
                        child: ListTile(
                          title: Text(e.parameterName.isEmpty ? e.parameterId : e.parameterName),
                          subtitle: Text(e.displayValue),
                        ),
                      ),
                    ),
                    if (_item!.notes != null && _item!.notes!.isNotEmpty)
                      Card(
                        child: ListTile(
                          title: const Text('Notes'),
                          subtitle: Text(_item!.notes!),
                        ),
                      ),
                  ],
                ),
    );
  }
}
