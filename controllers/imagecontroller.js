const Image = require("../models/imagemodel");

const uploadImage = async (req, res) => {
  try {
    const base64Image = req.file.buffer.toString("base64");

    const newImage = new Image({
      name: req.file.originalname,
      image: {
        data: base64Image,
        contentType: req.file.mimetype,
      },
    });

    await newImage.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      imageId: newImage._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Image upload failed",
      error: error.message,
    });
  }
};

const getImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({
      name: image.name,
      image: image.image.data,
      contentType: image.image.contentType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadImage,
  getImage,
};
