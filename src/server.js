import express from 'express'
import { MongoClient } from "mongodb";
import { async } from 'regenerator-runtime';
import path from 'path';


const app = express();

app.use(express.static(path.join(__dirname,'/build')));
app.use(express.json());

const withDB = async (operations, res) =>{

    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }

}

app.get('/api/articles/:name', async (req, res) => {

    withDB( async (db) =>{
        const article = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: article });
        res.status(200).json(articleInfo);
    },res)
})

app.post('/api/articles/:name/upvote', async(req, res) => {

    withDB(async(db) =>{
        const article = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: article });

        db.collection('articles').updateOne({ name: article}, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            }
        })

        const updatedArticleInfo = await db.collection('articles').findOne({ name: article });
        res.status(200).json(updatedArticleInfo);

    },res)
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;

    const article = req.params.name;

    withDB(async(db) =>{
        const articleInfo = await db.collection('articles').findOne({ name: article });

        db.collection('articles').updateOne({ name: article}, {
            '$set': {
                comments: articleInfo.comments.concat({username,text}),
            }
        })

        const updatedArticleInfo = await db.collection('articles').findOne({ name: article });
        res.status(200).json(updatedArticleInfo);

    },res)
    
});

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'/build/index.html'));
})

app.listen(8000, () => console.log('listening on port 8000'));