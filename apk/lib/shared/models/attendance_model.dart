class AttendanceModel {
  AttendanceModel({
    required this.id,
    required this.siteId,
    required this.siteName,
    required this.status,
    required this.attendanceDate,
    this.checkIn,
    this.checkOut,
    this.checkInLat,
    this.checkInLng,
  });

  final String id;
  final String siteId;
  final String siteName;
  final String status;
  final String attendanceDate;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final double? checkInLat;
  final double? checkInLng;

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    // Safe DateTime parser
    DateTime? tryDt(dynamic v) {
      if (v == null) return null;
      final s = v.toString().trim();
      if (s.isEmpty) return null;
      return DateTime.tryParse(s)?.toLocal();
    }


    double? tryDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString().trim());
    }

    final rawDate =
    (json['attendance_date'] ?? json['attendanceDate'] ?? '').toString();
    final attendanceDate =
    rawDate.length >= 10 ? rawDate.substring(0, 10) : rawDate;

    return AttendanceModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      siteId: (json['site_id'] ?? json['siteId'] ?? '').toString(),
      siteName: (json['site_name'] ?? json['siteName'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      attendanceDate: attendanceDate,
      checkIn: tryDt(json['check_in'] ?? json['checkIn']),
      checkOut: tryDt(json['check_out'] ?? json['checkOut']),
      checkInLat: tryDouble(json['check_in_lat']),
      checkInLng: tryDouble(json['check_in_lng']),
    );
  }
}