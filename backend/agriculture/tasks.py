from django.core.management import call_command
from django_rq import job

@job
def run_batch(minutes):
    """
    RQ Task to run the batch processing management command.
    """
    print(f"🔄 RQ Task Started: Processing last {minutes} minutes...")
    call_command('process_batch', minutes=minutes)
    print("✅ RQ Task Completed.")
