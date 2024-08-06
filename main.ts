import { AnalyzeDocumentCommand, AnalyzeDocumentCommandInput, AnalyzeDocumentCommandOutput } from "@aws-sdk/client-textract";
import { TextractClient } from "@aws-sdk/client-textract";
import { fromIni } from '@aws-sdk/credential-providers';
import fs from 'fs';

const REGION = "us-east-1";
const profileName = "daniela";

const textractClient = new TextractClient({
  region: REGION,
  credentials: fromIni({ profile: profileName, }),
});

const imageFiles = [
  'test-00.jpg',  // Image file with text and tables, not hand-written
  'test-01.jpg',  // Sticky note with hand-written text and irrelevant background
  'test-02.jpg',  // Sticky note with hand-written text and background with text
  'test-03.PNG',  // Notebook with hand-written text and irrelevant background
];

const tests: { command: AnalyzeDocumentCommandInput, file: string }[] = imageFiles.map((test) => {
  return {
    command: {
      Document: {
        Bytes: fs.readFileSync(`./imgs/${test}`),
      },
      FeatureTypes: ["TABLES", "FORMS"],
    },
    file: test
  }
});

const displayBlockInfo = async (file: string, response: AnalyzeDocumentCommandOutput) => {
  try {
    let textContent = "";

    response.Blocks?.forEach(block => {
      console.log(`ID: ${block.Id}`)
      console.log(`Block Type: ${block.BlockType}`)
      if ("Text" in block && block.Text !== undefined) {
        console.log(`Text: ${block.Text}`)
        textContent += `${block.Text}\n`
      }
      else { }
      if ("Confidence" in block && block.Confidence !== undefined) {
        console.log(`Confidence: ${block.Confidence}`)
      }
      else { }
      if (block.BlockType == 'CELL') {
        console.log("Cell info:")
        console.log(`   Column Index - ${block.ColumnIndex}`)
        console.log(`   Row - ${block.RowIndex}`)
        console.log(`   Column Span - ${block.ColumnSpan}`)
        console.log(`   Row Span - ${block.RowSpan}`)
      }
      if ("Relationships" in block && block.Relationships !== undefined) {
        console.log(block.Relationships)
        console.log("Geometry:")
        console.log(`   Bounding Box - ${JSON.stringify(block.Geometry?.BoundingBox)}`)
        console.log(`   Polygon - ${JSON.stringify(block.Geometry?.Polygon)}`)
      }
      console.log("-----")
    });

    fs.writeFileSync('./tests/' + file.split('.').at(0) + '.txt', textContent, {
      flag: 'w'
    })
  } catch (err) {
    console.log("Error", err);
  }
}

const analyze_document_text = async () => {
  try {
    tests.forEach(async ({ command, file }) => {
      const analyzeDoc = new AnalyzeDocumentCommand(command);
      const response = await textractClient.send(analyzeDoc);

      displayBlockInfo(file, response)
    })
  } catch (err) {
    console.log("Error", err);
  }
}

analyze_document_text()
