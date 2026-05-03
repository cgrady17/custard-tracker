
export async function scrapeMoosa() {
  // MooSa's doesn't post daily rotating flavors online. 
  // They specialize in soft-serve custard staples and signature shakes.
  
  return {
    flavors: [
      {
        name: "Vanilla, Chocolate, or Twist",
        description: "MooSa's signature soft-serve custard. Always smooth and creamy.",
        imageUrl: ""
      },
      {
        name: "Custard Shakes",
        description: "Hand-spun shakes in flavors like Vanilla, Chocolate, Strawberry, Peanut Butter, and Cotton Candy.",
        imageUrl: ""
      }
    ],
    isOpen: false,
    statusMessage: "Closed for the Season (Opens mid-June)"
  };
}
