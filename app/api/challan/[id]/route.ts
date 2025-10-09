import { NextRequest, NextResponse } from 'next/server';
import { getChallan, deleteChallan } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challanData = await getChallan(params.id);
    
    if (!challanData) {
      return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    }

    return NextResponse.json(challanData);
  } catch (error) {
    console.error('Error fetching challan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteChallan(params.id);
    return NextResponse.json({ message: 'Challan deleted successfully' });
  } catch (error) {
    console.error('Error deleting challan:', error);
    return NextResponse.json(
      { error: 'Failed to delete challan' },
      { status: 500 }
    );
  }
}