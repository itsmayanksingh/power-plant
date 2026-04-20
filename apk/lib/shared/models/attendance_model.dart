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
    DateTime? tryDt(dynamic v) => DateTime.tryParse('${v ?? ''}');
    return AttendanceModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      siteId: (json['site_id'] ?? json['siteId'] ?? '').toString(),
      siteName: (json['site_name'] ?? json['siteName'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      attendanceDate: (json['attendance_date'] ?? json['attendanceDate'] ?? '').toString(),
      checkIn: tryDt(json['check_in'] ?? json['checkIn']),
      checkOut: tryDt(json['check_out'] ?? json['checkOut']),
      checkInLat: (json['check_in_lat'] as num?)?.toDouble(),
      checkInLng: (json['check_in_lng'] as num?)?.toDouble(),
    );
  }
}

