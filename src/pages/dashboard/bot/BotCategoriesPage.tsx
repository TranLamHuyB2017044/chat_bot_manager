import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { useAuthStore } from "@/store/authStore";
import { Category } from "@/types/category";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  RefreshCw,
  FileText,
  AlertTriangle,
  FolderOpen,
  Search,
  Check,
  X,
  Smile,
  ShieldAlert ,
  Loader2,
} from "lucide-react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";

export const DEFAULT_CATEGORY_EMOJI = "📁";

export const renderCategoryEmojiOrIcon = (
  iconStr?: string,
  className?: string,
  fallbackSize: number = 18
) => {
  if (!iconStr) {
    return <FolderKanban size={fallbackSize} className={className} />;
  }
  // Check if string contains emoji/text or is an old lucide icon name
  const isLucideIconName = /^[A-Z][a-zA-Z0-9]+$/.test(iconStr.trim()) && iconStr.length > 2;
  if (isLucideIconName) {
    return <FolderKanban size={fallbackSize} className={className} />;
  }
  return <span className={className || "leading-none select-none text-base"}>{iconStr}</span>;
};

export default function BotCategoriesPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots } = useChatbotStore();
  const { user } = useAuthStore();
  const isHydrated = useStoreHydration();

  const bot = chatbots.find((b) => b.id === botId);
  const workspaceId = bot?.workspaceId || bot?.id;
  const isAdmin = user?.role === 0;

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDeletedMode, setViewDeletedMode] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState(DEFAULT_CATEGORY_EMOJI);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (autoSlug && !editingCategory) {
      setFormSlug(generateSlug(val));
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/chatbot/workspaces/${workspaceId}/categories`);
      const data = await res.json();
      const isSuccess = res.ok || data?.statusCode === 200 || data?.status === "success";
      if (isSuccess) {
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setCategories(list);
      } else {
        toast.error(data?.message || "Không thể tải danh sách chuyên mục");
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      // Không bắn toast lỗi nếu mạng bị ngắt quãng hoặc response rỗng
    } finally {
      setLoading(false);
    }
  };

  // Fetch Deleted Categories (Admin only)
  const fetchDeletedCategories = async () => {
    if (!workspaceId || !isAdmin) return;
    setLoadingDeleted(true);
    try {
      const res = await apiFetch(`/api/admin/workspaces/${workspaceId}/categories/deleted`);
      const data = await res.json();
      const isSuccess = res.ok || data?.statusCode === 200 || data?.status === "success";
      if (isSuccess) {
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setDeletedCategories(list);
      } else {
        // Chỉ log hoặc không toast nếu thùng rác rỗng
        if (data?.statusCode !== 404) {
          toast.error(data?.message || "Không thể tải danh mục đã xóa");
        }
      }
    } catch (err: any) {
      console.error("Error fetching deleted categories:", err);
    } finally {
      setLoadingDeleted(false);
    }
  };



  useEffect(() => {
    if (workspaceId && isHydrated) {
      fetchCategories();
      if (isAdmin) {
        fetchDeletedCategories();
      }
    }
  }, [workspaceId, isHydrated, isAdmin]);

  // Handle Create / Update
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormIcon(DEFAULT_CATEGORY_EMOJI);
    setIsEmojiPickerOpen(false);
    setFormDescription("");
    setAutoSlug(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || DEFAULT_CATEGORY_EMOJI);
    setIsEmojiPickerOpen(false);
    setFormDescription(cat.description || "");
    setAutoSlug(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !workspaceId) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        // PUT /api/chatbot/workspaces/<ws>/categories/<slug>
        const res = await apiFetch(
          `/api/chatbot/workspaces/${workspaceId}/categories/${editingCategory.slug}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: formName.trim(),
              icon: formIcon,
              description: formDescription.trim(),
              slug: formSlug.trim() || undefined,
            }),
          }
        );
        const data = await res.json();
        const isSuccess = res.ok || data?.statusCode === 200;
        if (isSuccess) {
          toast.success("Cập nhật chuyên mục thành công!");
          setIsModalOpen(false);
          await fetchCategories();
        } else {
          toast.error(data?.message || "Cập nhật chuyên mục thất bại");
        }
      } else {
        // POST /api/chatbot/workspaces/<ws>/categories
        const finalSlug = formSlug.trim() || generateSlug(formName.trim());
        const res = await apiFetch(`/api/chatbot/workspaces/${workspaceId}/categories`, {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            slug: finalSlug,
            icon: formIcon,
            description: formDescription.trim(),
          }),
        });
        const data = await res.json();
        const isSuccess = res.ok || data?.statusCode === 200 || data?.statusCode === 201;
        if (isSuccess) {
          toast.success("Tạo mới chuyên mục thành công!");
          setIsModalOpen(false);
          await fetchCategories();
        } else {
          toast.error(data?.message || "Tạo chuyên mục thất bại");
        }
      }
    } catch (err: any) {
      console.error("Submit category error:", err);
      toast.error("Có lỗi xảy ra khi lưu chuyên mục!");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete (DELETE /api/chatbot/workspaces/<ws>/categories/<slug>?confirm=true)
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !workspaceId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(
        `/api/chatbot/workspaces/${workspaceId}/categories/${deleteTarget.slug}?confirm=true`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      const isSuccess = res.ok || data?.statusCode === 200;
      if (isSuccess) {
        toast.success(
          `Đã xóa category "${deleteTarget.name}".`
        );
        setDeleteTarget(null);
        await fetchCategories();
        if (isAdmin) {
          await fetchDeletedCategories();
        }
      } else {
        toast.error(data?.message || "Xóa chuyên mục thất bại!");
      }
    } catch (err: any) {
      console.error("Delete category error:", err);
      toast.error("Có lỗi xảy ra khi xóa chuyên mục!");
    } finally {
      setDeleting(false);
    }
  };

  // Handle Restore (POST /api/admin/workspaces/<ws>/categories/<slug>/restore)
  const handleRestore = async (slug: string) => {
    if (!workspaceId || !isAdmin) return;
    try {
      const res = await apiFetch(
        `/api/admin/workspaces/${workspaceId}/categories/${slug}/restore`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Khôi phục chuyên mục và tài liệu thành công!");
        await fetchCategories();
        await fetchDeletedCategories();
      } else {
        toast.error(data?.message || "Khôi phục chuyên mục thất bại!");
      }
    } catch (err: any) {
      console.error("Restore category error:", err);
      toast.error("Có lỗi xảy ra khi khôi phục chuyên mục!");
    }
  };

  if (!bot) {
    if (!isHydrated || chatbots.length === 0) {
      return (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={32} />
        </div>
      );
    }
    return null;
  }

  const filteredCategories = (viewDeletedMode ? deletedCategories : categories).filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header bar */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban size={20} className="text-brand" />
            <h1 className="text-base font-bold text-text-primary dark:text-textDark-primary">
              Quản lý Chuyên mục (Categories)
            </h1>
            <Badge variant="info">
              Workspace: {bot.name}
            </Badge>
          </div>
          <p className="text-xs text-text-muted dark:text-textDark-secondary mt-1">
            Phân loại tri thức và tài liệu theo chuyên mục để chatbot tra cứu chuẩn xác và hỗ trợ widget chọn chủ đề
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant={viewDeletedMode ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewDeletedMode(!viewDeletedMode)}
              className="text-xs"
              icon={<ShieldAlert size={14} />}
            >
              {viewDeletedMode ? "Xem danh mục hoạt động" : `Thùng rác (${deletedCategories.length})`}
            </Button>
          )}

          {!viewDeletedMode && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="text-xs font-semibold shadow-sm"
              icon={<Plus size={14} />}
            >
              Tạo chuyên mục mới
            </Button>
          )}
        </div>
      </div>

      {/* Main Table / Cards view */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border dark:border-dark-border">
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-textDark-secondary"
            />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted dark:text-textDark-secondary">
            <span>
              {viewDeletedMode ? "Đã xóa:" : "Tổng chuyên mục:"}{" "}
              <strong className="text-text-primary dark:text-textDark-primary">
                {viewDeletedMode ? deletedCategories.length : categories.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 text-text-muted dark:text-textDark-secondary">
            <FolderOpen size={40} className="mx-auto mb-2 text-brand/30 stroke-[1.2]" />
            <p className="text-xs font-semibold">
              {viewDeletedMode
                ? "Không có chuyên mục nào trong thùng rác"
                : searchTerm
                ? "Không tìm thấy chuyên mục phù hợp"
                : "Chưa có chuyên mục nào được tạo"}
            </p>
            {!viewDeletedMode && !searchTerm && (
              <p className="text-[11px] mt-1">
                Nhấn vào nút &quot;Tạo chuyên mục mới&quot; ở trên để bắt đầu phân loại tài liệu.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              return (
                <div
                  key={cat.slug}
                  className="group flex flex-col justify-between p-4 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-card hover:border-brand/40 transition shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/15 text-brand flex items-center justify-center shrink-0 border border-brand/20 group-hover:scale-105 transition-transform text-lg">
                          {renderCategoryEmojiOrIcon(cat.icon, "text-lg")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary truncate">
                            {cat.name}
                          </h3>
                          <span className="inline-block mt-0.5 text-[10px] font-mono text-brand bg-brand/10 dark:bg-brand/15 px-2 py-0.5 rounded-btn">
                            {cat.slug}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                      {!viewDeletedMode ? (
                        <>
                          <Tooltip content="Chỉnh sửa">
                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              className="p-1.5 rounded-btn text-text-muted hover:text-brand hover:bg-brand/10 transition"
                            >
                              <Edit2 size={13} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Xóa chuyên mục">
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              className="p-1.5 rounded-btn text-text-muted hover:text-danger hover:bg-danger/10 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </Tooltip>
                        </>
                      ) : (
                        isAdmin && (
                          <Tooltip content="Khôi phục chuyên mục">
                            <button
                              onClick={() => handleRestore(cat.slug)}
                              className="p-1.5 rounded-btn text-text-muted hover:text-success hover:bg-success/10 transition"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </Tooltip>
                        )
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary dark:text-textDark-secondary mt-2 line-clamp-2 leading-relaxed">
                    {cat.description || "Chưa có mô tả cho chuyên mục này."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-surface-border/60 dark:border-dark-border/60 flex items-center justify-between text-[11px] text-text-muted dark:text-textDark-secondary">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-brand" />
                    <span>
                      <strong className="text-text-primary dark:text-textDark-primary">
                        {cat.doc_count !== undefined ? cat.doc_count : 0}
                      </strong>{" "}
                      tài liệu
                    </span>
                  </div>

                  {cat.created_at && (
                    <span>
                      {new Date(cat.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border dark:border-dark-border mb-4">
              <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
                <span className="text-lg leading-none">{formIcon || DEFAULT_CATEGORY_EMOJI}</span>
                {editingCategory ? "Cập nhật chuyên mục" : "Tạo chuyên mục mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Chọn Emoji */}
              <div className="relative">
                <label className="block text-xs font-semibold text-text-primary dark:text-textDark-primary mb-1.5">
                  Biểu tượng cảm xúc (Emoji)
                </label>
                
                <div className="flex items-center gap-3">
                  {/* Button trigger picker */}
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="flex items-center gap-2.5 px-3 py-2 bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn hover:border-brand transition shadow-xs group"
                  >
                    <span className="text-2xl leading-none select-none group-hover:scale-110 transition-transform">
                      {formIcon || DEFAULT_CATEGORY_EMOJI}
                    </span>
                    <span className="text-xs text-text-muted group-hover:text-text-primary transition flex items-center gap-1 font-medium">
                      <Smile size={14} className="text-brand" />
                      Chọn Emoji
                    </span>
                  </button>

                  {/* Input trực tiếp nếu user muốn gõ hoặc paste emoji từ bàn phím */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Hoặc dán emoji trực tiếp..."
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Popover Emoji Picker từ thư viện emoji-picker-react */}
                {isEmojiPickerOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-surface-border dark:border-dark-border animate-scaleIn">
                    <div className="flex items-center justify-between px-3 py-2 bg-surface-card dark:bg-dark-card border-b border-surface-border dark:border-dark-border">
                      <span className="text-xs font-bold text-text-primary dark:text-textDark-primary flex items-center gap-1.5">
                        <Smile size={14} className="text-brand" /> Chọn Emoji
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="text-text-muted hover:text-text-primary text-xs p-1 rounded-btn"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <EmojiPicker
                      onEmojiClick={(emojiData: EmojiClickData) => {
                        setFormIcon(emojiData.emoji);
                        setIsEmojiPickerOpen(false);
                      }}
                      autoFocusSearch={false}
                      theme={Theme.AUTO}
                      width={320}
                      height={380}
                      searchPlaceHolder="Tìm emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary dark:text-textDark-primary mb-1">
                  Tên chuyên mục <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chính sách bảo hành, Hướng dẫn sử dụng..."
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-primary dark:text-textDark-primary">
                    Slug nhận diện (URL-friendly)
                  </label>
                  {!editingCategory && (
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className="text-[10px] text-brand hover:underline"
                    >
                      {autoSlug ? "Tự động tạo (Đang bật)" : "Tự đặt thủ công"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="chinh-sach-bao-hanh"
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary dark:text-textDark-primary mb-1">
                  Mô tả chuyên mục
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả nội dung các tài liệu thuộc danh mục này..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border dark:border-dark-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  className="text-xs font-semibold shadow-sm"
                  icon={<Check size={14} />}
                >
                  {editingCategory ? "Lưu thay đổi" : "Tạo chuyên mục"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center gap-3 text-danger mb-3">
              <div className="p-2 rounded-full bg-danger/10">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                  Xác nhận xóa chuyên mục
                </h3>
                
              </div>
            </div>

            <div className="p-3 bg-danger/5 border border-danger/20 rounded-card text-xs text-text-secondary dark:text-textDark-secondary space-y-2 mb-4">
              <p>
                Bạn có chắc chắn muốn xóa chuyên mục:{" "}
                <strong className="text-danger font-bold">{deleteTarget.name}</strong>{" "}
              </p>
                <p>Tất cả tài liệu liên kết với chuyên mục này sẽ bị <strong>Xóa</strong>.</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                loading={deleting}
                className="text-xs font-semibold shadow-sm"
                icon={<Trash2 size={13} />}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
