export const dynamic = 'force-dynamic';

/**
 * PRODUCT CHANNEL CONFIGURATION API
 * Wave 1: Nigeria-First Modular Commerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChannelConfigService } from '@/lib/commerce/channel-config/channel-config-service';
import { getCurrentSession } from '@/lib/auth';
import { ChannelType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const channel = searchParams.get('channel') as ChannelType | null;
    const action = searchParams.get('action');

    if (action === 'tenant-channels') {
      const channels = await ChannelConfigService.getTenantChannels(tenantId);
      return NextResponse.json({ channels });
    }

    if (action === 'channel-products' && channel) {
      const products = await ChannelConfigService.getChannelProducts(
        tenantId,
        channel,
        { includeProduct: true }
      );
      return NextResponse.json({ products });
    }

    if (productId) {
      if (channel) {
        const config = await ChannelConfigService.getOrCreateConfig(
          tenantId,
          productId,
          channel
        );
        return NextResponse.json({ config });
      } else {
        const configs = await ChannelConfigService.getProductChannels(
          tenantId,
          productId
        );
        return NextResponse.json({ configs });
      }
    }

    return NextResponse.json({ error: 'productId or action required' }, { status: 400 });
  } catch (error) {
    console.error('Channel config GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { productId, channel, action, ...updates } = body;

    if (!productId || !channel) {
      return NextResponse.json(
        { error: 'productId and channel required' },
        { status: 400 }
      );
    }

    const canAccess = await ChannelConfigService.canAccessChannel(tenantId, channel);
    if (!canAccess) {
      return NextResponse.json(
        { error: `Tenant not subscribed to ${channel} channel` },
        { status: 403 }
      );
    }

    switch (action) {
      case 'enable':
        const enabled = await ChannelConfigService.enableChannel(
          tenantId,
          productId,
          channel
        );
        return NextResponse.json({ config: enabled, message: 'Channel enabled' });

      case 'pause':
        const paused = await ChannelConfigService.pauseChannel(
          tenantId,
          productId,
          channel
        );
        return NextResponse.json({ config: paused, message: 'Channel paused' });

      case 'disable':
        const disabled = await ChannelConfigService.disableChannel(
          tenantId,
          productId,
          channel
        );
        return NextResponse.json({ config: disabled, message: 'Channel disabled' });

      case 'update':
      default:
        const updated = await ChannelConfigService.updateConfig(
          tenantId,
          productId,
          channel,
          updates
        );
        return NextResponse.json({ config: updated });
    }
  } catch (error) {
    console.error('Channel config POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { productIds, channel, action } = body;

    if (!productIds || !channel) {
      return NextResponse.json(
        { error: 'productIds and channel required' },
        { status: 400 }
      );
    }

    if (action === 'bulk-enable') {
      const results = await ChannelConfigService.bulkEnableChannel(
        tenantId,
        productIds,
        channel
      );
      return NextResponse.json({
        success: true,
        count: results.length,
        message: `${results.length} products enabled for ${channel}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Channel config PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
