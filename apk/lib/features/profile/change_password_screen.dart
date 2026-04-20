import 'package:flutter/material.dart';

import '../../core/services/toast_service.dart';
import '../../core/widgets/app_page.dart';
import '../../shared/repositories/backend_repository.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await BackendRepository.instance.changePassword(
        currentPassword: _currentCtrl.text,
        newPassword: _newCtrl.text,
      );
      ToastService.success('Password changed');
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      ToastService.error('Failed: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'Change Password',
      child: Form(
        key: _formKey,
        child: ListView(
          children: <Widget>[
            TextFormField(
              controller: _currentCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current Password'),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _newCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New Password'),
              validator: (v) => (v == null || v.length < 8) ? 'Minimum 8 characters' : null,
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Updating...' : 'Update Password'),
            ),
          ],
        ),
      ),
    );
  }
}
