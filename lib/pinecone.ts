import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import md5 from 'md5';
import { getEmbeddings } from './embeddings';
import { convertToAscii } from "./utils";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const index = pc.index("ticketbot");

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(fileKey: string) {
  try {
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
      console.log("could not download from s3")
      throw new Error("could not download from s3");
    }
    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];
    
    const documents = await Promise.all(pages.map(prepareDocument));
    
    const vectors = await Promise.all(documents.flat().map(embedDocument));
    
    const namespace = convertToAscii(fileKey);

    await index.namespace(namespace).upsert(vectors);
    return documents;
  } catch (error) {
    console.log(error);
  }
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
