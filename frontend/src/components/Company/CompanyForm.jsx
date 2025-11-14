import React from 'react';
import { ChevronDown } from 'lucide-react';

// This is a "controlled component" that receives its state and handler via props.
const CompanyForm = ({ form, handleChange }) => {
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
            {/* --- UPDATED: Sector options --- */}
            <select className="input-base" name="sector" id="sector" value={form.sector} onChange={handleChange} required >
              <option value="">Select Sector</option>
              <option value="Food & Beverages">Food & Beverages</option>
              {/* Other sectors are removed for now as requested */}
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>
      </div>
      <div className="input-group-row">
        <div className="input-group-col">
          <label className='normal-bold' htmlFor="industry">Industry <span className='submit-error'>*</span></label>
          <div className="select-wrapper">
            {/* --- UPDATED: Industry options --- */}
            <select className="input-base" name="industry" id="industry" value={form.industry} onChange={handleChange} required>
              <option value="">Select industry</option>
              <option value="Agricultural Products">Agricultural Products</option>
              <option value="Food Retailers & Distributors">Food Retailers & Distributors</option>
              <option value="Alcoholic Beverages">Alcoholic Beverages</option>
              <option value="Meat, Poultry & Dairy">(Meat, Poultry & Dairy)</option>
              <option value="Non-alcoholic Beverages">Non-alcoholic Beverages</option>
              <option value="Processed Foods">Processed Foods</option>
              <option value="Restaurants">Restaurants</option>
              <option value="Tobacco">Tobacco</option>
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>
        <div className="input-group-col">
          <label className="normal-bold" htmlFor="companysize">Company Size <span className='submit-error'>*</span></label>
          <div className="select-wrapper">
            <select className="input-base" name="companysize" id="companysize" value={form.companysize} onChange={handleChange} required >
              <option value="">Select company size</option>
              <option value="1-50">1-50</option>
              <option value="51-100">51-100</option>
              <option value="101-500">101-500</option>
              <option value="501-1000">501-1000</option>
              <option value="More than 1000">More than 1000</option>
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>
      </div>
      <div className="input-group-row"> {/* This was structured slightly differently, fixing layout */}
        <div className="input-group-col">
            <label className="normal-bold">Reporting Year <span className='submit-error'>*</span></label>
            <span className="small-regular">Carbon emissions are reported yearly. It’s best practice to align your reporting year with your organization’s financial accounting period.</span>
            <input className="input-base" name="reportingYear" value={form.reportingYear} placeholder="MM/DD (Eg. 01/01)" onChange={handleChange} maxLength="5" />
            <span className="small-regular" style={{ color: "#82828280" }}>If you indicated 01/01, your calculation end date will be 31/12.</span>
        </div>
        {/* Added an empty div for layout consistency if needed, otherwise, the column will stretch */}
        <div className="input-group-col" style={{ flexBasis: '50%' }}></div>
      </div>
    </>
  );
};

export default CompanyForm;