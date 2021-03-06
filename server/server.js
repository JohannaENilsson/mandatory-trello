const express = require('express');
const app = express();

const { getClient, getDB, createObjectId } = require('./db');


app.use((req, res, next) => {
  if (req.is('json')) {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk.toString();
    });

    req.on('end', () => {
      try {
        data = JSON.parse(data);
        req.body = data;
        next();
      } catch (e) {
        res.status(400).end();
      }
    });
  } else {
    next();
  }
});

app.use((req, res, next) => {
  let start = new Date();
  res.once('finish', () => {
    console.log(req.method, req.path, res.statusCode, new Date() - start, 'ms');
  });
  next();
});

// ITEM ********************************************************************** */
let itemRouter = express.Router();
itemRouter.get('/', (req, res) => {
  const db = getDB();
  db.collection('items')
    .find({})
    .toArray()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function timeStamp() {
  let date = new Date();
  let theDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  return theDate;
}

itemRouter.patch('/:id', (req, res) => {
  let id = req.params.id;
  let data = req.body;

  if (!data) {
    res.status(400).end();
    return;
  }

  const db = getDB();

  db.collection('items')
    .updateOne(
      { _id: createObjectId(id) },
      {
        $set: {
          name: data.name,
          description: data.description,
          listId: data.listId,
          time: data.time,
        },
      }
    )
    .then((result) => {
      data._id = req.params.id;
      res.status(200).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

itemRouter.post('/', (req, res) => {
  let data = req.body;

  if (!data) {
    res.status(400).end();
    return;
  }

  let isValid = removeBlankSpace(data);

  if (isValid.length < 1) {
    res.status(400).end();
    return;
  }
  let theDate = timeStamp();
  data.name = isValid;
  data.time = theDate;
  data.listId = data.listId;

  const db = getDB();
  db.collection('items')
    .insertOne(data)
    .then((result) => {
      data._id = result.insertedId;
      res.status(201).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

itemRouter.delete('/:id', (req, res) => {
  let id = req.params.id;
  const db = getDB();

  db.collection('items')
    .deleteOne({ _id: createObjectId(id) })
    .then(() => {
      res.status(204).end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.use('/items', itemRouter);

// LIST ********************************************************************** */
let listRouter = express.Router();
listRouter.get('/', (req, res) => {
  const db = getDB();
  db.collection('lists')
    .find({})
    .toArray()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function removeBlankSpace(data) {
  let removeWhiteSpace = data.name.trim();
  return removeWhiteSpace;
}

listRouter.post('/', (req, res) => {
  let data = req.body;

  if (!data) {
    res.status(400).end();
    return;
  }

  let isValid = removeBlankSpace(data);

  if (isValid.length < 1) {
    res.status(400).end();
    return;
  }
  data.name = isValid;
  const db = getDB();
  db.collection('lists')
    .insertOne(data)
    .then((result) => {
      data._id = result.insertedId;
      res.status(201).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function removeAllItemsInList(db, listID) {
  db.collection('items')
    .deleteMany({ listId: listID })
    .then((data) => {
      console.log(data.deletedCount);
    });
}

listRouter.delete('/:id', (req, res) => {
  let id = req.params.id;
  const db = getDB();

  db.collection('lists')
    .deleteOne({ _id: createObjectId(id) })

    .then(() => {
      removeAllItemsInList(db, id);

      db.collection('lists')
        .find({ _id: createObjectId(id) })
        .toArray()
        .then((data) => {
          if (data.length === 0) {
            res.status(204).end();
          } else {
            res.status(404).end();
          }
        });
    })

    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

listRouter.patch('/:id', (req, res) => {
  let id = req.params.id;
  let data = req.body;

  if (!data) {
    res.status(400).end();
    return;
  }

  const db = getDB();

  db.collection('lists')
    .updateOne(
      { _id: createObjectId(id) },
      {
        $set: {
          name: data.name,
        },
      }
    )
    .then((result) => {
      data._id = req.params.id;
      res.status(200).send(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.use('/lists', listRouter);

const PORT = 8090;

app.listen(PORT, () => {
  console.log(`Connected to server at ${PORT}`);
});
