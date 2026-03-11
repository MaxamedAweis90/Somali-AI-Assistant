function normalizeMessage(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function isShortForeignPrompt(message: string) {
  const normalized = normalizeMessage(message).toLowerCase();

  return (
    normalized.length <= 30 &&
    /(speak english|english please|respond in english|hello|hi|hey|write in english)/i.test(normalized)
  );
}

function isTranslationPrompt(message: string) {
  return /(translate|tarjun|u tarjun|to somali|af-soomali)/i.test(message);
}

function isArabicPrompt(message: string) {
  return /(carabi|arabic|العربية|arab)/i.test(message);
}

export function createFallbackReply(userText: string) {
  const normalized = normalizeMessage(userText);

  if (isShortForeignPrompt(normalized)) {
    return [
      "Luqaddaas waan fahmi karaa, laakiin anigu waxaan ku shaqeeyaa Af-Somali 😄",
      "",
      "Bal su'aashaada Af-Somali ku soo qor si aan si fiican kuugu caawiyo.",
    ].join("\n");
  }

  if (isArabicPrompt(normalized)) {
    return [
      "الذكاء الاصطناعي يساعد الناس على كتابة الأفكار وتنظيم المعلومات.",
      "",
      "Sharaxaad kooban Af-Somali:",
      "Artificial Intelligence wuxuu kaa caawin karaa qorista, qorsheynta, iyo habeynta xogta.",
    ].join("\n");
  }

  if (isTranslationPrompt(normalized)) {
    return [
      "Waxaan helay codsigaaga turjumaadda.",
      "",
      "Tarjumid Af-Somali ah:",
      "-----",
      "Waxaan diyaar u ahay inaan kuu tarjumo qoraalka aad soo dirtay marka API-ga la xiro ama aad qoraalka si toos ah u soo geliso.",
      "-----",
    ].join("\n");
  }

  return [
    "### Jawaab kooban",
    "",
    `Waxaan fahmay fariintaada: **${normalized}**`,
    "",
    "### Qodobbo muhiim ah",
    "",
    "- Waxaan kuugu jawaabayaa Af-Somali",
    "- Waxaan u habeyn karaa jawaabta liis ama qaybo cadcad",
    "- Haddii aad rabto, waxaan sii faahfaahin karaa qodob kasta",
  ].join("\n");
}