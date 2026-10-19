// Discount (in %) on the doctor's base fee for each consultation mode.
// Change these numbers to match your own hospital rules.
const MODE_DISCOUNT = {
  "in-person": 0,
  online: 20,
  phone: 30,
};

const calculateFee = (baseFee, mode = "in-person") => {
  const discountPercent = MODE_DISCOUNT[mode] ?? 0;
  const discount = Math.round((baseFee * discountPercent) / 100);

  return {
    mode,
    baseFee,
    discountPercent,
    discount,
    total: baseFee - discount,
  };
};

export default calculateFee;
