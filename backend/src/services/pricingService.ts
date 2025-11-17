import { isPeakHour, getHoursDifference } from '../utils/dateUtils';

export class PricingService {
  /**
   * Calculate total price for a booking based on dynamic pricing rules
   * Peak hours (Mon-Fri 10AM-1PM, 4PM-7PM): 1.5x base rate
   * Off-peak: base rate
   */
  calculatePrice(startTime: Date, endTime: Date, baseRate: number): number {
    let totalPrice = 0;
    const currentSlot = new Date(startTime);

    // Iterate through each hour slot
    while (currentSlot < endTime) {
      const nextSlot = new Date(currentSlot);
      nextSlot.setHours(nextSlot.getHours() + 1);

      // Calculate the end of this slot (either next hour or booking end)
      const slotEnd = nextSlot > endTime ? endTime : nextSlot;
      
      // Calculate fraction of hour in this slot
      const hoursInSlot = getHoursDifference(currentSlot, slotEnd);

      // Apply peak/off-peak multiplier
      const rate = isPeakHour(currentSlot) ? baseRate * 1.5 : baseRate;

      totalPrice += rate * hoursInSlot;

      // Move to next slot
      currentSlot.setTime(nextSlot.getTime());
    }

    // Round to 2 decimal places
    return Math.round(totalPrice * 100) / 100;
  }
}

export default new PricingService();