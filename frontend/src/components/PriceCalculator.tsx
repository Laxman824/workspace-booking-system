import React, { useEffect, useState } from 'react';

interface PriceCalculatorProps {
  startTime: string;
  endTime: string;
  baseRate: number;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ startTime, endTime, baseRate }) => {
  const [estimate, setEstimate] = useState<{
    totalPrice: number;
    hours: number;
    peakHours: number;
    offPeakHours: number;
  } | null>(null);

  useEffect(() => {
    if (!startTime || !endTime || !baseRate) {
      setEstimate(null);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setEstimate(null);
      return;
    }

    let totalPrice = 0;
    let peakHours = 0;
    let offPeakHours = 0;
    const currentSlot = new Date(start);

    while (currentSlot < end) {
      const nextSlot = new Date(currentSlot);
      nextSlot.setHours(nextSlot.getHours() + 1);

      const slotEnd = nextSlot > end ? end : nextSlot;
      const hoursInSlot = (slotEnd.getTime() - currentSlot.getTime()) / (1000 * 60 * 60);

      const isPeak = isPeakHour(currentSlot);
      const rate = isPeak ? baseRate * 1.5 : baseRate;

      if (isPeak) {
        peakHours += hoursInSlot;
      } else {
        offPeakHours += hoursInSlot;
      }

      totalPrice += rate * hoursInSlot;
      currentSlot.setTime(nextSlot.getTime());
    }

    setEstimate({
      totalPrice: Math.round(totalPrice * 100) / 100,
      hours: peakHours + offPeakHours,
      peakHours,
      offPeakHours,
    });
  }, [startTime, endTime, baseRate]);

  const isPeakHour = (date: Date): boolean => {
    const day = date.getDay();
    const hour = date.getHours();
    const isWeekday = day >= 1 && day <= 5;
    const isMorningPeak = hour >= 10 && hour < 13;
    const isEveningPeak = hour >= 16 && hour < 19;
    return isWeekday && (isMorningPeak || isEveningPeak);
  };

  if (!estimate) return null;

  return (
    <div className="price-calculator">
      <h3>💰 Live Price Estimate</h3>
      
      <div className="price-estimate">
        ₹{estimate.totalPrice.toLocaleString()}
      </div>

      <div className="price-breakdown">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>⏱️</div>
          <div>
            <strong>Total Duration</strong>
            <div style={{ opacity: 0.9 }}>{estimate.hours.toFixed(2)} hours</div>
          </div>
        </div>

        {estimate.peakHours > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>📈</div>
            <div>
              <strong>Peak Hours</strong>
              <div style={{ opacity: 0.9 }}>
                {estimate.peakHours.toFixed(2)} hrs @ ₹{(baseRate * 1.5).toFixed(0)}/hr
              </div>
            </div>
          </div>
        )}

        {estimate.offPeakHours > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>📉</div>
            <div>
              <strong>Off-Peak Hours</strong>
              <div style={{ opacity: 0.9 }}>
                {estimate.offPeakHours.toFixed(2)} hrs @ ₹{baseRate}/hr
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="price-note">
        <strong>💡 Smart Pricing</strong><br />
        This is a real-time estimate. Final price will be confirmed upon booking.
      </div>
    </div>
  );
};