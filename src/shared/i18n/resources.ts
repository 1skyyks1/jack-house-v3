import { enAuth, zhAuth } from "./resources/auth"
import { enAdmin, zhAdmin } from "./resources/admin"
import { enBase, zhBase } from "./resources/base"
import { enForum, zhForum } from "./resources/forum"
import { enEvent, zhEvent } from "./resources/event"
import { enPack, zhPack } from "./resources/pack"
import { enPost, zhPost } from "./resources/post"
import { enRichText, zhRichText } from "./resources/richText"
import { enTournament, zhTournament } from "./resources/tournament"
import { enUser, zhUser } from "./resources/user"
import { enMappackCreator, zhMappackCreator } from "./resources/mappackCreator"
import { enManiaAnalyser, zhManiaAnalyser } from "./resources/maniaAnalyser"
import { enAccuracyCalculator, zhAccuracyCalculator } from "./resources/accuracyCalculator"
import { enAiImage, zhAiImage } from "./resources/aiImage"

export const zhTranslation = {
  ...zhBase,
  ...zhAuth,
  ...zhAdmin,
  ...zhForum,
  ...zhEvent,
  ...zhPost,
  ...zhPack,
  ...zhUser,
  ...zhRichText,
  ...zhTournament,
  ...zhMappackCreator,
  ...zhManiaAnalyser,
  ...zhAccuracyCalculator,
  ...zhAiImage,
  tools: {
    ...zhManiaAnalyser.tools,
    ...zhAiImage.tools,
  },
  admin: {
    ...zhAdmin.admin,
    ...zhAiImage.admin,
    nav: {
      ...zhAdmin.admin.nav,
      ...zhAiImage.admin.nav,
    },
  },
} as const

export const enTranslation = {
  ...enBase,
  ...enAuth,
  ...enAdmin,
  ...enForum,
  ...enEvent,
  ...enPost,
  ...enPack,
  ...enUser,
  ...enRichText,
  ...enTournament,
  ...enMappackCreator,
  ...enManiaAnalyser,
  ...enAccuracyCalculator,
  ...enAiImage,
  tools: {
    ...enManiaAnalyser.tools,
    ...enAiImage.tools,
  },
  admin: {
    ...enAdmin.admin,
    ...enAiImage.admin,
    nav: {
      ...enAdmin.admin.nav,
      ...enAiImage.admin.nav,
    },
  },
} as const

export const resources = {
  zh: {
    translation: zhTranslation,
  },
  en: {
    translation: enTranslation,
  },
} as const
