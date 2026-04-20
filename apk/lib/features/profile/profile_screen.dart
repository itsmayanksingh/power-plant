import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/toast_service.dart';
import '../../core/state/session_controller.dart';
import '../../shared/models/user_model.dart';
import '../../shared/repositories/backend_repository.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserModel? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _user = await BackendRepository.instance.getMe();
    } catch (_) {
      _user = SessionController.instance.user;
    }
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Future<void> _logout() async {
    await SessionController.instance.logout();
    if (!mounted) return;
    ToastService.info('Logged out');
    context.go('/login');
  }

  Widget _body() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final user = _user;
    if (user == null) return const Text('Unable to load profile.');
    return ListView(
      children: <Widget>[
        Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(user.name),
            subtitle: Text('${user.email}\nRole: ${user.role}'),
            isThreeLine: true,
          ),
        ),
        const SizedBox(height: 10),
        FilledButton.icon(
          onPressed: () => context.push('/profile/edit'),
          icon: const Icon(Icons.edit),
          label: const Text('Edit Profile'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => context.push('/profile/change-password'),
          icon: const Icon(Icons.lock_reset),
          label: const Text('Change Password'),
        ),
        const SizedBox(height: 10),
        TextButton.icon(
          onPressed: _logout,
          icon: const Icon(Icons.logout),
          label: const Text('Logout'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) => _body();
}

