import 'package:flutter/foundation.dart';

import '../../shared/models/user_model.dart';
import '../../shared/repositories/backend_repository.dart';
import '../storage/secure_storage_service.dart';

class SessionController extends ChangeNotifier {
  SessionController._();
  static final SessionController instance = SessionController._();

  UserModel? user;
  bool bootstrapped = false;
  bool isLoading = false;

  bool get isAuthenticated => user != null;

  Future<void> bootstrap() async {
    if (bootstrapped) return;
    isLoading = true;
    notifyListeners();
    try {
      final token = await SecureStorageService.accessToken();
      if (token == null || token.isEmpty) {
        user = null;
      } else {
        user = await BackendRepository.instance.getMe();
      }
    } catch (_) {
      user = null;
      await SecureStorageService.clearTokens();
    } finally {
      bootstrapped = true;
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    isLoading = true;
    notifyListeners();
    try {
      user = await BackendRepository.instance.login(email: email, password: password);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await BackendRepository.instance.logout();
    user = null;
    notifyListeners();
  }
}

