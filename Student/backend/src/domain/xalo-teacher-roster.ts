/** Danh sách GV chính thức + thư mục tài liệu Google Drive (cập nhật theo học vụ). */
export type XaloTeacherRosterEntry = {
  id: string;
  name: string;
  email: string;
  materialsDriveUrl: string;
};

function driveFolder(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export const XALO_GV_ROSTER: readonly XaloTeacherRosterEntry[] = [
  {
    id: 'tch-tuongvy',
    name: 'Vũ Hoàng Tường Vy',
    email: 'tuongvy.vu@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1TDgjxXn-DYZ9brUcPn25Nt71hRSJ7TnA'),
  },
  {
    id: 'tch-giaphu',
    name: 'Huỳnh Gia Phú',
    email: 'giaphu.huynh@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1C12vj34cgk7FE6bTyPdHdfPXXrN7U8RX'),
  },
  {
    id: 'tch-khanhthi',
    name: 'Lê Nguyễn Khánh Thi',
    email: 'khanhthi.le@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1YHyVdyryhN-v1bScLLdNSjWufMoyIUS8'),
  },
  {
    id: 'tch-nhuhai',
    name: 'Lê Như Hải',
    email: 'nhuhai.le@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1flBoX_KgMSPDxIvD3pzkoSsQvHABIghF'),
  },
  {
    id: 'tch-khiem',
    name: 'Mai Tôn Khiêm',
    email: 'khiem.mai@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1DKm752WyNJkCJWFkAwFWARsjf0DVlow4'),
  },
  {
    id: 'tch-quynhchau',
    name: 'Nghiêm Doãn Quỳnh Châu',
    email: 'quynhchau.nghiem@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1TW5h_aTI7oNUEfSrdDAo2OLWz3ndQMy1'),
  },
  {
    id: 'tch-trungdung',
    name: 'Nguyễn Lê Trung Dũng',
    email: 'trungdung.nguyen@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1Ug3UMszHTAboJ-xR2eDUgDI8ePq0SGb_'),
  },
  {
    id: 'tch-minhtam',
    name: 'Nguyễn Lưu Minh Tâm',
    email: 'minhtam.nguyen@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1l02d8KAVsCSs14OqJ8j9bJsY9bv3aMhS'),
  },
  {
    id: 'tch-hoangsa',
    name: 'Nguyễn Thị Hoàng Sa',
    email: 'hoangsa.nguyen@xalo.edu.vn',
    materialsDriveUrl: driveFolder('116R811fUeA4zhm_7qAw30y6DYUZUBXpv'),
  },
  {
    id: 'tch-hongnhung',
    name: 'Nguyễn Thị Hồng Nhung',
    email: 'hongnhung.nguyen@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1ftHph_LYbybCLK7cUJe0Ft8hZNzr1Uu3'),
  },
  {
    id: 'tch-dangduy',
    name: 'Nguyễn Văn Đăng Duy',
    email: 'dangduy@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1sHraZJk43hkqonFyMiRdxfLOfQXCOYHM'),
  },
  {
    id: 'tch-nhatvy',
    name: 'Phan Võ Nhật Vy',
    email: 'nhatvy.phan@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1cmm8ue59qttIsAwsQOs1looQpoumqRTw'),
  },
  {
    id: 'tch-duykhai',
    name: 'Tất Duy Khải',
    email: 'duykhai.tat@xalo.edu.vn',
    materialsDriveUrl: driveFolder('14HItAI1d0D_4U4jkV3Zr6C37q4C2toPQ'),
  },
  {
    id: 'tch-dangkhoa',
    name: 'Thái Đỗ Đăng Khoa',
    email: 'dangkhoa.thai@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1vqaqICpL7uo61TSOk_FL51wYHevAWg8k'),
  },
  {
    id: 'tch-thanhtam',
    name: 'Thanh Tâm',
    email: 'thanhtam.le@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1ibABaWtd8V57KzVjpLbycs4ojNE9LN0E'),
  },
  {
    id: 'tch-quangminh',
    name: 'Trần Quang Minh',
    email: 'quangminh.tran@xalo.edu.vn',
    materialsDriveUrl: driveFolder('1kVfcUcwPo7PqX_ArDs59e5-8vzeGPaUj'),
  },
] as const;

export const XALO_GV_NAMES = XALO_GV_ROSTER.map((t) => t.name);
