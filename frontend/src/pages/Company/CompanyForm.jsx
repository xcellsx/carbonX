import { ChevronDown } from 'lucide-react';

const SECTOR_INDUSTRIES = {
  'Food & Beverages': [
    'Agricultural Products',
    'Food Retailers & Distributors',
    'Alcoholic Beverages',
    'Meat, Poultry & Dairy',
    'Non-alcoholic Beverages',
    'Processed Foods',
    'Restaurants',
    'Tobacco',
  ],
  'Transportation': [
    'Air Freight & Logistics',
    'Airlines',
    'Autoparts',
    'Automobiles',
    'Car Rental & Leasing',
    'Cruise Lines',
    'Marine Transportation',
    'Rail Transportation',
    'Road Transportation',
  ],
};

const CompanyForm = ({ form, handleChange }) => {
  const industries = form.sector ? (SECTOR_INDUSTRIES[form.sector] || []) : [];
  const industryOptions = industries.map((ind) => ({ value: ind, label: ind }));

  const onSectorChange = (e) => {
    handleChange(e);
    // Clear industry when sector changes so user must pick a valid industry for new sector
    handleChange({ target: { name: 'industry', value: '' } });
  };

  return (
    <>
      <div className="input-group-row">
        <div className="input-group-col">
          <label className="normal-bold">Company Name <span className='submit-error'>*</span></label>
          <input className="input-base" name="companyName" value={form.companyName} placeholder="Company Name" onChange={handleChange} />
        </div>
        <div className="input-group-col">
          <label className="normal-bold">Sector <span className='submit-error'>*</span></label>
          <div className="select-wrapper">
            <select className="input-base" name="sector" id="sector" value={form.sector} onChange={onSectorChange} required >
              <option value="">Select Sector</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Transportation">Transportation</option>
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>
      </div>
      <div className="input-group-row">
        <div className="input-group-col">
          <label className='normal-bold' htmlFor="industry">Industry <span className='submit-error'>*</span></label>
          <div className="select-wrapper">
            <select className="input-base" name="industry" id="industry" value={form.industry} onChange={handleChange} required>
              <option value="">Select Industry</option>
              {industryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>
        <div className="input-group-col">
          <label className="normal-bold">Reporting Year <span className='submit-error'>*</span></label>
          <span className="small-regular">Carbon emissions are reported yearly. It’s best practice to align your reporting year with your organization’s financial accounting period.</span>
          <input className="input-base" name="reportingYear" value={form.reportingYear} placeholder="MM/DD (Eg. 01/01)" onChange={handleChange} maxLength="5" />
          <span className="small-regular" style={{ color: "#82828280" }}>If you indicated 01/01, your calculation end date will be 31/12.</span>
        </div>
      </div>
    </>
  );
};

export default CompanyForm;