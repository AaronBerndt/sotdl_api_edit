import { VercelRequest, VercelResponse } from "@vercel/node";
import { updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";
import { Item } from "./updateEquipCharacterGear";

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
      partyId: documents.partyId,
      level: documents.level,
      ancestry: documents.ancestry,
      turnType: documents.turnType,
      activeCombat: documents.activeCombat,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [
        ...documents.characteristics.filter(({ id }: any) => id),
      ].map(({ value, ...rest }) => ({ ...rest, value: Number(value) })),
      talents: [],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: documents.items
          .filter(({ itemType }) => itemType === "weapon")
          .map(({ name }) => name),
        armor: documents.items
          .filter(({ itemType }) => itemType === "armor")
          .map(({ name }) => name),
        otherItems: documents.items
          .filter(({ itemType }) => itemType === "basic")
          .map(({ name }) => name),
        currency: documents.currency,
      },
      languages: [],
      professions: [],
      details: [],
      choices: documents.choices,
      characterState: {
        damage: 0,
        injured: false,
        expended: [],
        overrides: documents.overrides,
        afflictions: [],
        temporaryEffects: [],
        equipped: documents.items
          .filter(({ itemType }) => itemType !== "basic")
          .map((item: Item) => ({
            _id: new ObjectId(),
            name: item.name,
            equipped: true,
          })),
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });
    response.status(200).send(`Updated character ${_id}`);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
