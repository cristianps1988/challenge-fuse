import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

export async function GET() {
  try {
    logger.info('Fetching confidence thresholds');

    const thresholdRepository = container.getThresholdRepository();
    const thresholds = await thresholdRepository.findAll();

    return NextResponse.json({ thresholds });
  } catch (error) {
    logger.error('Failed to fetch thresholds', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch thresholds' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { thresholds } = body;

    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json(
        { error: 'thresholds object is required' },
        { status: 400 }
      );
    }

    for (const [type, value] of Object.entries(thresholds)) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        return NextResponse.json(
          { error: `Invalid threshold value for ${type}: must be between 0 and 1` },
          { status: 400 }
        );
      }
    }

    logger.info('Updating confidence thresholds', { thresholds });

    const useCase = container.getUpdateThresholdsUseCase();
    const result = await useCase.execute({ thresholds });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to update thresholds', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to update thresholds' },
      { status: 500 }
    );
  }
}
