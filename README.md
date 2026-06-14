# PackCheck 🎒 — Your Cozy Kawaii Daily Carry Checklist

PackCheck is a cozy, kawaii-themed daily carry planner designed as a **Frontend Web Application (FWA)**. It helps you manage what you carry daily, checklist your packing steps, and double-check that you do not leave required items behind.

---

## 🇺🇸 English Version

### 🌟 Project Concept
PackCheck provides a cozy paper-notebook aesthetic to gamify packing. It implements a two-phase check-off mechanism (Morning Departure and Evening Return) to ensure that what goes out with you returns home safely.

### 🛠️ Technology Stack
- **Structure**: Vanilla HTML5 utilizing semantic elements and an SVG paper-noise filter.
- **Styling**: Vanilla CSS3 with custom variables, smooth transitions, bouncy animations, responsive layout, and custom scrollbars.
- **Logic**: Vanilla ES6 JavaScript (No frameworks).
- **PWA Capabilities**: Service Worker (`sw.js`) implementing a cache-first caching strategy for offline support and Web App Manifest (`manifest.json`) for standalone home screen installations.
- **iOS Webview Optimizations**:
  - **Storage Persistence**: Invokes `navigator.storage.persist()` to guard local storage against iOS Safari's automatic 7-day inactivity eviction.
  - **Strict Date Parsing**: Uses component-based instantiation (`new Date(year, month, day)`) instead of strict ISO strings to avoid iOS WebView `RangeError` crashes.
- **Capacitor Support**: Integrated with `@capacitor/preferences` for native preference storage and `@capacitor/local-notifications` for device return reminders, falling back gracefully to standard `localStorage` and alerts in the web browser.

### 🚀 Key Features
1. **Interactive Today Packing (2-Phase Flow)**:
   - **Morning Packing**: Select the items you need for the day (required items are auto-selected), then check them off as you pack them.
   - **Evening Return**: Check off items as you put them back in your bag to go home.
   - Progress bar with dynamic emojis depending on your check-off completion percentage.
2. **Items Management (CRUD)**:
   - View items as premium card layouts featuring image previews, descriptions, group tags, and required indicators.
   - Add new items or edit existing item information (populates the form, opens the accordion, and scrolls smoothly into view).
   - Delete items safely with a cute confirmation dialog.
3. **Collapsible History Log**:
   - Stores the last 30 days of carry logs.
   - Categorizes history entries into packed items and missed required items.
   - Visual badges show performance levels at a glance (e.g. `100% packed` or `⚠️ 2 missed`).
4. **Cozy Settings**:
   - **Bilingual Switcher**: Toggle instantly between English and Vietnamese.
   - **Smart Reminders**: Configure notifications on set times or hourly intervals.
   - **Dynamic Group Tags**: Create customized category tags (emoji + name) or delete them with confirm prompts.
   - **Data Backup & Restore**: Export all data into a JSON file or restore from it to prevent loss during system resets.

---

## 🇻🇳 Phiên bản Tiếng Việt

### 🌟 Ý tưởng dự án
PackCheck mang đến trải nghiệm đóng gói hành lý giống như ghi chép trên một cuốn sổ tay nhỏ xinh xắn. Ứng dụng cung cấp quy trình kiểm tra 2 pha (Xếp đồ buổi sáng và Dọn đồ ra về buổi tối) giúp bạn chắc chắn không bao giờ bỏ quên các món đồ quan trọng ở trường học hoặc nơi làm việc.

### 🛠️ Công nghệ sử dụng
- **Cấu trúc**: HTML5 thuần sử dụng các thẻ ngữ nghĩa và bộ lọc nhiễu SVG tạo hiệu ứng giấy nhám giả lập trang sổ tay.
- **Giao diện**: CSS3 thuần với hệ thống biến (variables) màu sắc pastel, hiệu ứng chuyển động nảy (bounce), thiết kế tương thích (responsive) và thanh cuộn tùy chỉnh.
- **Logic**: JavaScript ES6 thuần (Không sử dụng framework).
- **Ứng dụng PWA**: Tích hợp Service Worker (`sw.js`) với chiến lược bộ nhớ đệm cache-first để chạy ngoại tuyến (offline) và Manifest (`manifest.json`) cho phép cài đặt trực tiếp lên màn hình chính.
- **Tối ưu hóa iOS WebView**:
  - **Bảo vệ dữ liệu**: Gọi hàm `navigator.storage.persist()` ngăn iOS tự động xóa bộ nhớ `localStorage` sau 7 ngày không hoạt động.
  - **Khắc phục lỗi định dạng ngày**: Khởi tạo ngày tháng bằng tham số chi tiết (`new Date(year, month, day)`) tránh lỗi sập ứng dụng (`RangeError`) trên WebView của iOS.
- **Hỗ trợ Capacitor**: Liên kết với hệ thống preferences và thông báo của ứng dụng native qua `@capacitor/preferences` và `@capacitor/local-notifications`, tự động chuyển sang `localStorage` và cảnh báo trình duyệt nếu chạy trên web thông thường.

### 🚀 Tính năng nổi bật
1. **Kiểm đồ hôm nay (Quy trình 2 pha)**:
   - **Buổi sáng: Đi**: Lựa chọn đồ cần mang đi (đồ bắt buộc được chọn sẵn), tích chọn khi xếp chúng vào balo.
   - **Buổi chiều: Về**: Tích chọn lại từng món đồ khi thu dọn hành lý trước khi đi về để chắc chắn không bỏ quên đồ ở cơ quan/lớp học.
   - Thanh tiến độ hiển thị emoji biểu cảm sinh động thay đổi theo tỷ lệ đóng gói.
2. **Quản lý danh sách đồ vật (CRUD)**:
   - Hiển thị danh sách đồ vật dưới dạng thẻ có ảnh thu nhỏ, ghi chú, thẻ nhóm và biểu tượng bắt buộc.
   - Thêm đồ vật mới hoặc chỉnh sửa đồ vật đã có (tự động điền dữ liệu, mở rộng form và cuộn trang mượt mà).
   - Xóa đồ dùng kèm theo hộp thoại xác nhận dễ thương.
3. **Nhật ký Lịch sử đóng mở rộng**:
   - Lưu trữ nhật ký carry của 30 ngày gần nhất.
   - Phân loại trực quan danh sách đồ mang đi thành nhóm "Đã xếp" và nhóm "Đồ bắt buộc bị quên".
   - Huy hiệu trực quan hiển thị hiệu suất kiểm đồ (ví dụ: `100% đã xếp` hoặc `⚠️ 2 bị quên`).
4. **Cài đặt tiện ích**:
   - **Chuyển đổi ngôn ngữ**: Thay đổi tức thì giữa Tiếng Anh và Tiếng Việt.
   - **Nhắc nhở ra về**: Đặt lịch thông báo nhắc kiểm đồ theo giờ cố định hoặc theo định kỳ (ví dụ: mỗi 3 tiếng).
   - **Tùy biến nhóm đồ**: Thêm các nhóm tag riêng (nhập emoji + tên nhóm) hoặc xóa các nhóm tag không dùng tới.
   - **Sao lưu & Khôi phục**: Xuất toàn bộ dữ liệu ra file JSON hoặc nhập lại từ file sao lưu để tránh mất dữ liệu khi đổi thiết bị.
