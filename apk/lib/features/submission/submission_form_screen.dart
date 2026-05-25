import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
  final Map<String, TextEditingController> _textControllers = {};
  final Map<String, bool> _boolValues = {};
  final Map<String, String> _dropdownValues = {};
  final _notesCtrl = TextEditingController();

  SiteModel? _site;
  bool _loading = true;
  bool _submitting = false;

  // ── Progress tracking ────────────────────────────────────────────────────
  int get _totalFields => _site?.parameters.length ?? 0;

  int get _filledFields {
    int count = 0;
    for (final p in _site?.parameters ?? <SiteParameter>[]) {
      if (p.type == 'boolean') {
        if (_boolValues[p.id] == true) count++;
      } else if (p.type == 'dropdown') {
        final v = _dropdownValues[p.id] ?? '';
        if (v.isNotEmpty) count++;
      } else {
        final v = _textControllers[p.id]?.text.trim() ?? '';
        if (v.isNotEmpty) count++;
      }
    }
    return count;
  }

  double get _progress =>
      _totalFields == 0 ? 0 : _filledFields / _totalFields;

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
        _textControllers[p.id] = TextEditingController()
          ..addListener(() => setState(() {}));
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
      ToastService.success(
          'Submission saved. If offline, it will sync automatically.');
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      ToastService.error('Submission failed: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Parameter icon style ─────────────────────────────────────────────────
  ({IconData icon, Color bg, Color fg}) _paramStyle(SiteParameter p) {
    final name = p.name.toLowerCase();
    if (name.contains('temp')) {
      return (
      icon: Icons.thermostat_rounded,
      bg: const Color(0xFFE1F5EE),
      fg: const Color(0xFF0F6E56),
      );
    }
    if (name.contains('ph') || name.contains('water')) {
      return (
      icon: Icons.water_drop_outlined,
      bg: const Color(0xFFE6F1FB),
      fg: const Color(0xFF185FA5),
      );
    }
    if (name.contains('air') || name.contains('aqi') || name.contains('wind')) {
      return (
      icon: Icons.air_rounded,
      bg: const Color(0xFFFAEEDA),
      fg: const Color(0xFF854F0B),
      );
    }
    if (p.type == 'boolean') {
      return (
      icon: Icons.check_circle_outline_rounded,
      bg: const Color(0xFFE1F5EE),
      fg: const Color(0xFF0F6E56),
      );
    }
    if (p.type == 'dropdown') {
      return (
      icon: Icons.list_rounded,
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

  Widget _buildSiteBanner(SiteModel site) {
    final cs = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    final dateStr = '${now.day} ${months[now.month - 1]} ${now.year}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.outlineVariant.withOpacity(0.4), width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFE6F1FB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.factory_outlined,
                color: Color(0xFF185FA5), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(site.name,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined,
                        size: 12,
                        color: cs.onSurface.withOpacity(0.4)),
                    const SizedBox(width: 3),
                    Text(site.location,
                        style: TextStyle(
                          fontSize: 11,
                          color: cs.onSurface.withOpacity(0.45),
                        )),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(dateStr,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600)),
              Text("Today's entry",
                  style: TextStyle(
                      fontSize: 11,
                      color: cs.onSurface.withOpacity(0.4))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$_filledFields of $_totalFields fields filled',
              style: TextStyle(
                  fontSize: 12, color: cs.onSurface.withOpacity(0.45)),
            ),
            Text(
              '${(_progress * 100).round()}%',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1D9E75),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: _progress,
            minHeight: 3,
            backgroundColor: cs.outlineVariant.withOpacity(0.25),
            valueColor:
            const AlwaysStoppedAnimation<Color>(Color(0xFF1D9E75)),
          ),
        ),
      ],
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

  Widget _buildFieldCard(SiteParameter p) {
    final cs = Theme.of(context).colorScheme;
    final style = _paramStyle(p);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: cs.outlineVariant.withOpacity(0.4), width: 0.8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header row ─────────────────────────────────────────────
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: style.bg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(style.icon, size: 16, color: style.fg),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(p.name,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w500)),
                ),
                _RequiredPill(required: p.required),
              ],
            ),

            // ── Hint line ──────────────────────────────────────────────
            if (_fieldHint(p).isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6, bottom: 8),
                child: Text(
                  _fieldHint(p),
                  style: TextStyle(
                      fontSize: 11,
                      color: cs.onSurface.withOpacity(0.4)),
                ),
              )
            else
              const SizedBox(height: 10),

            // ── Input ──────────────────────────────────────────────────
            _buildInput(p),
          ],
        ),
      ),
    );
  }

  String _fieldHint(SiteParameter p) {
    if (p.type == 'number') {
      final parts = <String>['Numeric'];
      if (p.min != null && p.max != null) {
        parts.add('${p.min} – ${p.max}');
      } else if (p.min != null) {
        parts.add('Min ${p.min}');
      } else if (p.max != null) {
        parts.add('Max ${p.max}');
      }
      return parts.join(' · ');
    }
    if (p.type == 'dropdown') return 'Select one';
    if (p.type == 'boolean') return '';
    return 'Text';
  }

  Widget _buildInput(SiteParameter p) {
    // Boolean → styled switch row
    if (p.type == 'boolean') {
      return Row(
        children: [
          Switch.adaptive(
            value: _boolValues[p.id] ?? false,
            activeColor: const Color(0xFF1D9E75),
            onChanged: (v) => setState(() => _boolValues[p.id] = v),
          ),
          const SizedBox(width: 6),
          Text(
            (_boolValues[p.id] ?? false) ? 'Yes, completed' : 'Not done',
            style: TextStyle(
              fontSize: 13,
              color: (_boolValues[p.id] ?? false)
                  ? const Color(0xFF0F6E56)
                  : Theme.of(context).colorScheme.onSurface.withOpacity(0.45),
            ),
          ),
        ],
      );
    }

    // Dropdown
    if (p.type == 'dropdown') {
      return DropdownButtonFormField<String>(
        value: _dropdownValues[p.id],
        decoration: _inputDecoration(p.name),
        isExpanded: true,
        items: p.options
            .map((o) => DropdownMenuItem<String>(value: o, child: Text(o)))
            .toList(),
        onChanged: (v) => setState(() => _dropdownValues[p.id] = v ?? ''),
        validator: (v) =>
        p.required && (v == null || v.isEmpty) ? 'Required' : null,
      );
    }

    // Number / text
    final isNumber = p.type == 'number';
    return TextFormField(
      controller: _textControllers[p.id],
      keyboardType: isNumber
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.text,
      inputFormatters: isNumber
          ? [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))]
          : null,
      decoration: _inputDecoration(
        isNumber ? 'Enter value' : 'Enter ${p.name.toLowerCase()}',
      ),
      validator: (value) {
        final v = value?.trim() ?? '';
        if (p.required && v.isEmpty) return '${p.name} is required';
        if (isNumber && v.isNotEmpty) {
          final n = double.tryParse(v);
          if (n == null) return 'Enter a valid number';
          if (p.min != null && n < p.min!) return 'Minimum is ${p.min}';
          if (p.max != null && n > p.max!) return 'Maximum is ${p.max}';
        }
        return null;
      },
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
          fontSize: 13,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.35)),
      filled: true,
      fillColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
      contentPadding:
      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.5),
            width: 0.8),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.4),
            width: 0.8),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide:
        const BorderSide(color: Color(0xFF1D9E75), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE24B4A), width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE24B4A), width: 1.5),
      ),
    );
  }

  Widget _buildNotesCard() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border:
        Border.all(color: cs.outlineVariant.withOpacity(0.4), width: 0.8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1EFE8),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.notes_rounded,
                      size: 16, color: Color(0xFF5F5E5A)),
                ),
                const SizedBox(width: 10),
                const Text('Notes',
                    style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500)),
                const Spacer(),
                Text('Optional',
                    style: TextStyle(
                        fontSize: 11,
                        color: cs.onSurface.withOpacity(0.4))),
              ],
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              decoration: _inputDecoration('Any observations or remarks...'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Material(
      color: _submitting
          ? const Color(0xFF1D9E75).withOpacity(0.7)
          : const Color(0xFF1D9E75),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: _submitting ? null : _submit,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_submitting)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              else
                const Icon(Icons.send_rounded, size: 17, color: Colors.white),
              const SizedBox(width: 8),
              Text(
                _submitting ? 'Submitting...' : 'Submit data',
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AppPage(
      title: 'New Submission',
      child: _loading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : _site == null
          ? _buildSiteUnavailable()
          : Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _buildSiteBanner(_site!),
            const SizedBox(height: 16),
            _buildProgressBar(),
            const SizedBox(height: 20),
            _buildSectionLabel('Parameters'),
            ..._site!.parameters.map(_buildFieldCard),
            const SizedBox(height: 4),
            _buildSectionLabel('Notes'),
            _buildNotesCard(),
            const SizedBox(height: 20),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildSiteUnavailable() {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.domain_disabled_rounded,
              size: 40, color: cs.onSurface.withOpacity(0.2)),
          const SizedBox(height: 12),
          Text('Site details unavailable',
              style: TextStyle(
                  fontSize: 15,
                  color: cs.onSurface.withOpacity(0.45))),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back_rounded, size: 16),
            label: const Text('Go back'),
          ),
        ],
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _RequiredPill extends StatelessWidget {
  const _RequiredPill({required this.required});
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: required
            ? const Color(0xFFFCEBEB)
            : Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        required ? 'Required' : 'Optional',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: required
              ? const Color(0xFFA32D2D)
              : Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
        ),
      ),
    );
  }
}