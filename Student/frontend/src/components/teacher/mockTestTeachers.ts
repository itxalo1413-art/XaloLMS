/**
 * Đồng bộ với Aca `src/lib/mockTestTeacherNames.ts` MOCK_TEST_TEACHER_OPTIONS —
 * khi thêm/sửa bên ACA, cập nhật đồng thời ở đây; đổi `LOGGED_IN_TEACHER_NAME` nếu cần tài khoản demo khác.
 */
export const MOCK_TEST_TEACHER_OPTIONS = [
  "Lê Thị Diệu Linh",
  "ACA",
  "Nghiêm Doãn Quỳnh Châu",
  "Lê Minh Trang",
  "Phạm Hoàng An",
  "Trần Thu Lan",
] as const;

/** Mô phỏng GV đã đăng nhập trên portal này; ACA phải chọn đúng tên khi duyệt để ca hiển thị. */
export const LOGGED_IN_TEACHER_NAME: (typeof MOCK_TEST_TEACHER_OPTIONS)[number] =
  MOCK_TEST_TEACHER_OPTIONS[0];
