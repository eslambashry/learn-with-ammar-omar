import { categoryModel } from '../../../DB/model/category.model.js';
import { CustomError } from '../../utilities/customError.js';

/* ================= CREATE CATEGORY ================= */
export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const exists = await categoryModel.findOne({ name });
    if (exists) return next(new CustomError('Category already exists', 409));

    const category = await categoryModel.create({
      name,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET ALL CATEGORIES ================= */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryModel
      .find()
      .populate('createdBy', 'userName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET ONE CATEGORY ================= */
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return next(new CustomError('Category not found', 404));

    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

/* ================= UPDATE CATEGORY ================= */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return next(new CustomError('Category not found', 404));

    if (req.body.name) {
      category.name = req.body.name;
    }


    await category.save();

    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

/* ================= DELETE CATEGORY ================= */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return next(new CustomError('Category not found', 404));

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
