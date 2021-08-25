import { VercelRequest, VercelResponse } from "@vercel/node";
import { updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { documents, _id } = request.body.data;

    const newCharacterData: any = {
      _id,
      name: documents.name,
      level: documents.level,
      ancestry: documents.ancestry,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [
        ...documents.characteristics,
      ].map(({ value, ...rest }) => ({ ...rest, value: Number(value) })),
      talents: [],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: documents.items.filter(
          ({ itemType }) => itemType === "weapon"
        ),
        armor: documents.items.filter(({ itemType }) => itemType === "armor"),
        otherItems: documents.items.filter(
          ({ itemType }) => itemType === "basic"
        ),
        currency: documents.currency,
      },
      languages: [],
      professions: [],
      details: [],
      characterState: {
        damage: 0,
        expended: [],
        overrides: documents.overrides,
        afflictions: [],
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });
    response.status(200).send("Test");
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
