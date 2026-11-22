/* Real Unsplash photos for the templates, one per photo slot (Unsplash licence: free to use, hotlinking is allowed).
 * They load from images.unsplash.com, so previews and exports show sharp photos when online; a generated picture sits
 * underneath each one (see templates.ts) so a box is never blank offline. To swap a photo, replace its id (the part after
 * "photo-" in any images.unsplash.com address). */
const U = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const PHOTOS: Record<string, string> = {
  // brand store: hoodies, tees, shoes, bags, accessories, people
  brand_hoodie: U('1602365659636-26070b7fc7ca', 1200), brand_kid: U('1503944583220-79d8926ad5e2'), brand_sunglass: U('1572635196237-14b3f281503f'),
  brand_shoes2: U('1542291026-7eec264c27ff'), brand_catshoe: U('1595950653106-6c9ebd614d3a'), brand_brush: U('1610136649349-0f646f318053'),
  brand_bag: U('1598532163257-ae3c6b2524b6'), brand_tee: U('1787682912838-4d0edf47cfbe'), brand_sneaker: U('1560769629-975ec94e6a86'),
  brand_sweat: U('1578587018452-892bacefd3f2'), brand_womanbag: U('1613482184972-f9c1022d0928'), brand_grayshirt: U('1624223237138-21a37e61dec0'),
  brand_womanbag2: U('1523779105320-d1cd346ff52b'), brand_tank: U('1509631179647-0177331693ae'), brand_head: U('1583373351761-fa9e3a19c99d'),
  brand_beanie: U('1617171594202-100a53bdfe04'), brand_manbeanie: U('1660486044177-45cd45bb5e99'),
  // silk listing: coats, tees, blouses
  silk_coat: U('1539533113208-f6df8cc8b543', 1200), silk_tee22: U('1618354691551-44de113f0164'), silk_graytee: U('1499971856191-1a420a42b498'),
  silk_white: U('1620799140408-edc6dcb6d633'), silk_blue: U('1614975059251-992f11792b9f'), silk_green: U('1612731486606-2614b4d74921'),
  silk_blacktee: U('1636774399627-ce738a640124'), silk_beige: U('1539533018447-63fcce2678e3'), silk_pink: U('1582164256364-b0eccb922bff'),
  silk_blouse: U('1611178206064-2ae27f72b9ca'), silk_trench: U('1633821879282-0c4e91f96232'), silk_tan: U('1608635680046-aebf91c1a9c8'),
  // velour editorial
  velour_hero: U('1562292817-58d294c3a7e3', 1200), velour_jacket1: U('1550872199-63f4382fe925'), velour_dark: U('1612731486606-2614b4d74921'),
  velour_orange: U('1622080159549-11537bf939e6'), velour_woman: U('1529139574466-a303027c1d8b'), velour_tan: U('1514813836041-518668f092b1'),
  // art shop: paintings, screens, customers
  art_p1: U('1605721911519-3dfeb3be25e7'), art_p2: U('1602464729960-f95937746b68'), art_p3: U('1533208087231-c3618eab623c'), art_p4: U('1531913764164-f85c52e6e654'),
  art_p5: U('1618331835717-801e976710b2'), art_p6: U('1547826039-bfc35e0f1ea8'), art_p7: U('1612487528505-d2338264c821'), art_p8: U('1531489956451-20957fab52f2'),
  art_combo: U('1541367777708-7905fe3296c0', 1200), art_top1: U('1547658719-da2b51169166'), art_top2: U('1585247226801-bc613c441316'),
  art_top3: U('1541462608143-67571c6738dd'), art_top4: U('1558655146-364adaf1fcc9'),
  art_c1: U('1580489944761-15a19d654956'), art_c2: U('1500648767791-00dcc994a43e'), art_c3: U('1494790108377-be9c29b29330'), art_c4: U('1544005313-94ddf0286df2'),
  // mortgage / home
  tot2_mother: U('1761839256545-4268b03606c0'), tot2_dad: U('1758523670969-dd1b1254062d', 1200), tot2_buy: U('1570129477492-45c003edd2be'),
  tot2_refi: U('1560518883-ce09059eeffa'), tot2_cash: U('1759428679273-11d914866394'), tot1_man: U('1568602471122-7832951cc4c5'),
};
