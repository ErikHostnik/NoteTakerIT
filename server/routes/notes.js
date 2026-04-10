const router = require('express').Router()
const Note = require('../models/Note')
const auth = require('../middleware/auth')

// All routes require auth
router.use(auth)

// GET all notes (isDoc=false)
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find({ isDoc: false }).lean()
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all docs (isDoc=true)
router.get('/docs', async (req, res) => {
  try {
    const docs = await Note.find({ isDoc: true }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create note or doc
router.post('/notes', async (req, res) => {
  try {
    const note = await Note.create(req.body)
    res.status(201).json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update note or doc
router.put('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!note) return res.status(404).json({ error: 'Not found' })
    res.json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE note or doc
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ id: req.params.id })
    if (!note) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST bulk migrate — only inserts new records (used on first login to move localStorage data)
router.post('/migrate', async (req, res) => {
  try {
    const { notes = [], docs = [] } = req.body
    const all = [...notes, ...docs]
    if (!all.length) return res.json({ migrated: 0 })

    const ops = all.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: { $setOnInsert: item },
        upsert: true
      }
    }))
    const result = await Note.bulkWrite(ops)
    res.json({ migrated: result.upsertedCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST import — overwrites all existing data with imported backup
router.post('/import', async (req, res) => {
  try {
    const { notes = [], docs = [] } = req.body
    const all = [...notes, ...docs]

    // Delete everything then insert
    await Note.deleteMany({})
    if (all.length) await Note.insertMany(all)

    res.json({ imported: all.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
