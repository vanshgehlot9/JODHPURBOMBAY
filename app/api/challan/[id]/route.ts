import { NextRequest, NextResponse } from 'next/server';
import { getChallan, deleteChallan, updateChallan } from '@/lib/firestore';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challanData = await request.json();
    
    // Convert date string to Date object if needed
    if (typeof challanData.date === "string") {
      challanData.date = new Date(challanData.date);
    }

    await updateChallan(params.id, challanData);
    
    return NextResponse.json({ 
      message: 'Challan updated successfully',
      challanId: params.id
    });
  } catch (error) {
    console.error('Error updating challan:', error);
    return NextResponse.json(
      { error: 'Failed to update challan' },
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