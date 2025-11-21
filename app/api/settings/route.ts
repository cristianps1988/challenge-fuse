import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

export async function GET() {
  try {
    logger.info('Fetching app settings');

    const useCase = container.getGetSettingsUseCase();
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'settings object is required' },
        { status: 400 }
      );
    }

    logger.info('Updating app settings', { settings });

    const useCase = container.getUpdateSettingsUseCase();
    const result = await useCase.execute({ settings });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to update settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
