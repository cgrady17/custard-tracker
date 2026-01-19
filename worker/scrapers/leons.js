
export async function scrapeLeons() {
  // Leon's doesn't post flavors online. 
  // We list their daily staples and provide a message about the rotating special.
  
  return {
    flavors: [
      {
        name: "Vanilla, Chocolate, Butter Pecan",
        description: "Leon's daily staples. Always available.",
        imageUrl: ""
      },
      {
        name: "Rotating Special",
        description: "Leon's features a rotating special: Strawberry, Raspberry, Mint, Maple Walnut, Cinnamon, or Blue Moon. Call (414) 383-1784 to confirm today's special.",
        imageUrl: ""
      }
    ],
    isOpen: true,
    statusMessage: "Call to confirm special"
  };
}
