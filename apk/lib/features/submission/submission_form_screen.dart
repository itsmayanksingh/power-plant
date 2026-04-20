import 'package:flutter/material.dart';

import '../../core/services/toast_service.dart';
import '../../core/widgets/app_page.dart';
import '../../shared/models/site_model.dart';
import '../../shared/repositories/backend_repository.dart';

class SubmissionFormScreen extends StatefulWidget {
  const SubmissionFormScreen({super.key, this.site});
  final SiteModel? site;

  @override
  State<SubmissionFormScreen> createState() => _SubmissionFormScreenState();
}

class _SubmissionFormScreenState extends State<SubmissionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _textControllers = <String, TextEditingController>{};
  final Map<String, bool> _boolValues = <String, bool>{};
  final Map<String, String> _dropdownValues = <String, String>{};
  final _notesCtrl = TextEditingController();
  SiteModel? _site;
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _site = widget.site;
    if (_site == null) {
      try {
        _site = await BackendRepository.instance.mySite();
      } catch (_) {}
    }
    for (final p in _site?.parameters ?? <SiteParameter>[]) {
      if (p.type == 'boolean') {
        _boolValues[p.id] = false;
      } else if (p.type == 'dropdown' && p.options.isNotEmpty) {
        _dropdownValues[p.id] = p.options.first;
      } else {
        _textControllers[p.id] = TextEditingController();
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    for (final c in _textControllers.values) {
      c.dispose();
    }
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final values = <String, dynamic>{};
    for (final p in _site!.parameters) {
      if (p.type == 'boolean') {
        values[p.id] = _boolValues[p.id] == true;
      } else if (p.type == 'dropdown') {
        values[p.id] = _dropdownValues[p.id];
      } else {
        values[p.id] = _textControllers[p.id]?.text.trim();
      }
    }

    final payload = BackendRepository.instance.buildSubmissionPayload(
      siteId: _site!.id,
      valuesByParameterId: values,
      notes: _notesCtrl.text,
      submissionDate: DateTime.now(),
    );

    try {
      await BackendRepository.instance.createSubmission(payload);
      ToastService.success('Submission saved. If offline, it will sync automatically.');
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      ToastService.error('Submission failed: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'New Submission',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _site == null
              ? const Text('Site details unavailable.')
              : Form(
                  key: _formKey,
                  child: ListView(
                    children: <Widget>[
                      Card(
                        child: ListTile(
                          title: Text(_site!.name),
                          subtitle: Text(_site!.location),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ..._site!.parameters.map(_buildField),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _notesCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(labelText: 'Notes'),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _submitting ? null : _submit,
                        icon: _submitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.send),
                        label: Text(_submitting ? 'Submitting...' : 'Submit'),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildField(SiteParameter p) {
    if (p.type == 'boolean') {
      return Card(
        child: SwitchListTile(
          value: _boolValues[p.id] == true,
          title: Text(p.name),
          onChanged: (v) => setState(() => _boolValues[p.id] = v),
        ),
      );
    }
    if (p.type == 'dropdown') {
        return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: DropdownButtonFormField<String>(
          initialValue: _dropdownValues[p.id],
          decoration: InputDecoration(labelText: p.name),
          items: p.options
              .map((o) => DropdownMenuItem<String>(value: o, child: Text(o)))
              .toList(),
          onChanged: (v) => setState(() => _dropdownValues[p.id] = v ?? ''),
          validator: (v) => p.required && (v == null || v.isEmpty) ? 'Required' : null,
        ),
      );
    }
    final isNumber = p.type == 'number';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: _textControllers[p.id],
        keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        decoration: InputDecoration(labelText: p.name),
        validator: (value) {
          final v = value?.trim() ?? '';
          if (p.required && v.isEmpty) return 'Required';
          if (isNumber && v.isNotEmpty) {
            final n = double.tryParse(v);
            if (n == null) return 'Invalid number';
            if (p.min != null && n < p.min!) return 'Min ${p.min}';
            if (p.max != null && n > p.max!) return 'Max ${p.max}';
          }
          return null;
        },
      ),
    );
  }
}
