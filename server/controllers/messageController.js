const Message = require('../models/Message');
const Siswa = require('../models/Siswa');

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).populate('reply_to', 'isi nama_pengirim role_pengirim');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { isi, pengirim_id, reply_to } = req.body;

    const user = await Siswa.findById(pengirim_id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const newMessage = new Message({
      pengirim: user._id,
      nama_pengirim: user.nama,
      role_pengirim: user.role,
      isi,
      reply_to: reply_to || null
    });

    await newMessage.save();
    await newMessage.populate('reply_to', 'isi nama_pengirim role_pengirim');
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
