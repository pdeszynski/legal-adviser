import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders title and value correctly', () => {
    render(
      <StatCard title="Total Documents" value={42} icon={<div data-testid="icon">Icon</div>} />,
    );

    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders string value correctly', () => {
    render(<StatCard title="Status" value="Active" icon={<div data-testid="icon">Icon</div>} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <StatCard
        title="Loading Test"
        value={100}
        icon={<div data-testid="icon">Icon</div>}
        loading={true}
      />,
    );

    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('applies custom icon color', () => {
    const { container } = render(
      <StatCard title="Color Test" value={1} icon={<div>Icon</div>} iconColor="text-red-600" />,
    );

    const iconContainer = container.querySelector('.text-red-600');
    expect(iconContainer).toBeInTheDocument();
  });
});
