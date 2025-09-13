import os
from typing import Optional
import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import models
from .deps import get_db
from .routers_auth import get_current_user


router = APIRouter(prefix="/billing", tags=["billing"])

# Initialize Stripe
stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
if stripe_secret_key:
    stripe.api_key = stripe_secret_key
else:
    print("Warning: STRIPE_SECRET_KEY not set. Stripe functionality will not work.")


class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CreateBillingPortalRequest(BaseModel):
    return_url: str


@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""
    try:
        # Get or create Stripe customer
        customer = await get_or_create_stripe_customer(current_user, db)

        success_url = request.success_url or f"{os.getenv('FRONTEND_URL', 'http://localhost:8080')}/app/dashboard?success=true"
        cancel_url = request.cancel_url or f"{os.getenv('FRONTEND_URL', 'http://localhost:8080')}/pricing?canceled=true"

        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': request.price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            allow_promotion_codes=True,
        )

        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-billing-portal")
async def create_billing_portal(
    request: CreateBillingPortalRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe billing portal session"""
    try:
        # Get or create Stripe customer
        customer = await get_or_create_stripe_customer(current_user, db)

        portal_session = stripe.billing_portal.Session.create(
            customer=customer.id,
            return_url=request.return_url,
        )

        return {"portal_url": portal_session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status for user"""
    try:
        # Get Stripe customer
        customer = await get_or_create_stripe_customer(current_user, db)

        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer.id,
            status='active',
            limit=1
        )

        if subscriptions.data:
            subscription = subscriptions.data[0]
            return {
                "status": "active",
                "subscription_id": subscription.id,
                "current_period_end": subscription.current_period_end,
                "plan_name": subscription.items.data[0].price.nickname or "Premium Plan",
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        else:
            return {"status": "inactive"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def get_or_create_stripe_customer(user: models.User, db: Session):
    """Get existing Stripe customer or create new one"""
    # Check if user already has a Stripe customer ID
    if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
        try:
            return stripe.Customer.retrieve(user.stripe_customer_id)
        except stripe.error.InvalidRequestError:
            # Customer doesn't exist in Stripe, create new one
            pass

    # Create new Stripe customer
    customer = stripe.Customer.create(
        email=user.email,
        name=user.email.split('@')[0],  # Use email prefix as name
        metadata={
            'user_id': str(user.id)
        }
    )

    # Save customer ID to user (assuming we add this field to User model)
    # For now, we'll just return the customer
    # In production, you'd want to save this to the database
    # user.stripe_customer_id = customer.id
    # db.commit()

    return customer