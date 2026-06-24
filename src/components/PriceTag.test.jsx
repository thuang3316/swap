import { render, screen } from '@testing-library/react';
import { PriceTag } from './ItemCard.jsx';

describe('PriceTag', () => {
  it('renders "Negotiable" when the price is null', () => {
    render(<PriceTag price={null} />);
    expect(screen.getByText('Negotiable')).toBeInTheDocument();
  });

  it('renders the formatted amount when a price is set', () => {
    render(<PriceTag price="45.00" />);
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('keeps up to two decimal places for non-whole prices', () => {
    render(<PriceTag price="120.50" />);
    expect(screen.getByText('$120.5')).toBeInTheDocument();
  });
});
