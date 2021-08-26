import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection, updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";

export type Expend = {
  name: string;
};

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { action, whatToExpend, _id } = request.body;

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { expended, ...characterStateRest },
      ...rest
    } = characterData;

    const newExpendedList =
      action === "add"
        ? [...expended, { name: whatToExpend }]
        : expended.length === 1
        ? expended.filter(({ name }: Expend) => name !== whatToExpend)
        : expended.splice(
            expended.indexOf(
              (expendedObject: Expend) => expendedObject.name === whatToExpend
            ),
            1
          );

    const newCharacterData = {
      ...rest,
      characterState: {
        expended: newExpendedList,
        ...characterStateRest,
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });

    response.status(200).send(data);
  } catch (e) {
    console.log(e);

    response.status(504).send(e);
  }
};

export default cors(handler);
