/** Free players. Matches the 1.25× copy in every locale. */
export const BOOST_MULTIPLIER = 1.25
/** Remove Ads owners. Matches the 2.5× copy in every locale. */
export const BOOST_MULTIPLIER_NO_ADS = 2.5

export function boostMultiplier(adsRemoved) {
  return adsRemoved ? BOOST_MULTIPLIER_NO_ADS : BOOST_MULTIPLIER
}
