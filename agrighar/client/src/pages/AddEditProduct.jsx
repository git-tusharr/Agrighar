import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { createProduct, updateProduct, getProductById, uploadProductImage } from "../api/axios";
import { FaLeaf, FaArrowLeft, FaSave, FaCamera, FaTimes, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

const CATEGORIES = ["vegetables", "fruits", "grains", "dairy", "spices", "other"];
const UNITS      = ["kg", "piece", "dozen", "liter", "bundle", "quintal"];

const MAX_IMAGE_MB = 5;

const AddEditProduct = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // if id exists → edit mode
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "", category: "vegetables", price: "", unit: "kg",
    quantity: "", description: "", isOrganic: false, isAvailable: true,
    image: "",
  });
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(isEdit);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "farmer") { navigate("/"); return; }
    if (isEdit) {
      getProductById(id)
        .then((res) => setForm((prev) => ({ ...prev, ...res.data })))
        .catch(() => toast.error("Failed to load product"))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ── Image upload (Cloudinary via backend) ─────────────────────
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_MB}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await uploadProductImage(file, setUploadProgress);
      setForm((prev) => ({ ...prev, image: res.data.url }));
      toast.success("Image uploaded! 📸");
    } catch (err) {
      toast.error(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity) {
      toast.error("Please fill all required fields"); return;
    }
    if (uploading) {
      toast.error("Please wait for the image to finish uploading"); return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateProduct(id, form);
        toast.success("Product updated!");
      } else {
        await createProduct(form);
        toast.success("Product listed successfully! 🌿");
      }
      navigate("/farmer/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
      // Demo: navigate anyway
      navigate("/farmer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="card p-6 space-y-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-600 text-white p-2.5 rounded-xl">
          <FaLeaf className="text-lg" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Product" : t("addProduct")}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEdit ? "Update your product listing" : "List your farm produce for sale"}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                {form.image ? (
                  <>
                    <img src={form.image} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      title="Remove image"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </>
                ) : uploading ? (
                  <div className="flex flex-col items-center gap-1 text-primary-600">
                    <FaSpinner className="animate-spin text-xl" />
                    <span className="text-xs font-medium">{uploadProgress}%</span>
                  </div>
                ) : (
                  <FaCamera className="text-3xl text-gray-300" />
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading}
                  className="hidden"
                  id="product-image-input"
                />
                <label
                  htmlFor="product-image-input"
                  className={`btn-secondary inline-flex items-center gap-2 cursor-pointer text-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <FaCamera />
                  {form.image ? "Change Photo" : "Upload Photo"}
                </label>
                <p className="text-xs text-gray-400 mt-1.5">
                  JPG, PNG or WEBP. Max {MAX_IMAGE_MB}MB. If skipped, a generic photo will be shown.
                </p>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("productName")} <span className="text-red-500">*</span>
            </label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Fresh Tomatoes, Alphonso Mangoes"
              className="input-field" required />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("category")} <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("unit")} <span className="text-red-500">*</span></label>
              <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
                {UNITS.map((u) => (
                  <option key={u} value={u}>{t(u) || u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("price")} (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input type="number" name="price" value={form.price} onChange={handleChange}
                  placeholder="0" min="1" className="input-field pl-7" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Available Stock <span className="text-red-500">*</span>
              </label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                placeholder="0" min="0" className="input-field" required />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("description")}</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe your product — freshness, growing method, harvest date..."
              rows={3} className="input-field resize-none" />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" name="isOrganic" checked={form.isOrganic} onChange={handleChange}
                className="accent-primary-600 w-4 h-4" />
              <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                🌿 Organic Product
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange}
                className="accent-primary-600 w-4 h-4" />
              <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                ✅ Available for Sale
              </span>
            </label>
          </div>

          {/* Price Preview */}
          {form.price && form.unit && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p className="text-sm text-primary-700 font-medium">Price Preview</p>
              <p className="text-2xl font-bold text-primary-800 mt-1">
                ₹{form.price} <span className="text-base font-normal text-primary-600">per {form.unit}</span>
              </p>
              {form.isOrganic && (
                <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                  <FaLeaf /> Organic badge will be shown
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading || uploading}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              <FaSave />
              {loading ? "Saving..." : (isEdit ? t("save") : "List Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
